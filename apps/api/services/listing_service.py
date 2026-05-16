"""Listing CRUD + lifecycle service."""

from datetime import date
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import (
    AuditAction,
    ListingPurpose,
    ListingStatus,
    ListingTier,
    TenantRole,
)
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.services._media_thumbs import batch_fallback_thumbnails as _batch_thumbs
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.listing_filters import apply_listing_filters as _apply_filters
from apps.api.services.listing_review_service import LOCKED_FOR_EDIT_STATUSES
from apps.api.services.listing_video_validation import validate_video_upload as _validate_video
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}
_RENT_PURPOSES = {ListingPurpose.RENT_SHORT, ListingPurpose.RENT_LONG}

_LISTING_ALLOWED_TRANSITIONS: dict[ListingStatus, set[ListingStatus]] = {
    # review workflow transitions handled by ListingReviewService
    ListingStatus.DRAFT: {ListingStatus.ACTIVE, ListingStatus.ARCHIVED},
    ListingStatus.ACTIVE: {
        ListingStatus.PAUSED,
        ListingStatus.EXPIRED,
        ListingStatus.ARCHIVED,
        ListingStatus.SOLD,
        ListingStatus.RENTED,
        ListingStatus.OFF_MARKET,
    },
    ListingStatus.PAUSED: {ListingStatus.ACTIVE, ListingStatus.ARCHIVED},
    ListingStatus.ARCHIVED: {ListingStatus.ACTIVE},
    ListingStatus.EXPIRED: {ListingStatus.ARCHIVED},
}

class ListingService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("listing_manager, property_admin, company_admin or company_owner required")

    def _validate_purpose_rent(self, purpose: ListingPurpose, rent_period) -> None:
        if purpose == ListingPurpose.SALE and rent_period is not None:
            raise bad_request("rent_period must be null for sale listings")
        if purpose in _RENT_PURPOSES and rent_period is None:
            raise bad_request("rent_period is required for rent listings")

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def _with_hero(self, stmt):
        """Attach selectinload for hero_media to avoid lazy-load in async context."""
        return stmt.options(selectinload(Listing.hero_media))

    async def batch_fallback_thumbnails(
        self, listings: list[Listing]
    ) -> dict[str, dict]:
        """Delegate to _media_thumbs.batch_fallback_thumbnails (no N+1)."""
        return await _batch_thumbs(self.session, listings)

    async def list_for_property(
        self, property_id: UUID, tenant_id: UUID
    ) -> tuple[list[Listing], int]:
        await self._set_rls(tenant_id)
        stmt = self._with_hero(select(Listing).where(
            Listing.property_id == property_id, Listing.tenant_id == tenant_id
        ))
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, len(items)

    async def list_listings(  # noqa: PLR0913
        self,
        tenant_id: UUID,
        *,
        status: ListingStatus | None = None,
        purpose: ListingPurpose | None = None,
        listing_tier: ListingTier | None = None,
        assigned_agent_id: UUID | None = None,
        assigned_reviewer_id: UUID | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        currency: str | None = None,
        country: str | None = None,
        city: str | None = None,
        area: str | None = None,
        created_from: date | None = None,
        created_to: date | None = None,
        valid_from_to: date | None = None,
        valid_until_from: date | None = None,
        q: str | None = None,
        # --- migration 0039 property-attribute filters ---
        property_type=None,
        min_bedrooms: int | None = None,
        max_bedrooms: int | None = None,
        min_bathrooms: int | None = None,
        max_bathrooms: int | None = None,
        amenities: list[str] | None = None,
        furnishing_status: str | None = None,
        completion_status: str | None = None,
        view_orientation: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Listing], int]:
        await self._set_rls(tenant_id)

        stmt = select(Listing).where(Listing.tenant_id == tenant_id)
        stmt = _apply_filters(
            stmt,
            assigned_agent_id=assigned_agent_id,
            assigned_reviewer_id=assigned_reviewer_id,
            status=status, purpose=purpose, listing_tier=listing_tier,
            min_price=min_price, max_price=max_price, currency=currency,
            country=country, city=city, area=area,
            created_from=created_from, created_to=created_to,
            valid_from_to=valid_from_to, valid_until_from=valid_until_from,
            q=q,
            property_type=property_type,
            min_bedrooms=min_bedrooms, max_bedrooms=max_bedrooms,
            min_bathrooms=min_bathrooms, max_bathrooms=max_bathrooms,
            amenities=amenities,
            furnishing_status=furnishing_status,
            completion_status=completion_status,
            view_orientation=view_orientation,
        )

        _col_map = {
            "created_at": Listing.created_at, "updated_at": Listing.updated_at,
            "price": Listing.price, "title": Listing.title,
        }
        col = _col_map.get(sort_by, Listing.created_at)
        order_col = col.asc() if sort_dir == "asc" else col.desc()

        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        items = list((await self.session.execute(
            self._with_hero(stmt).order_by(order_col).offset(skip).limit(limit)
        )).scalars().all())
        return items, total

    async def get_listing(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        await self._set_rls(tenant_id)
        stmt = self._with_hero(
            select(Listing).where(Listing.id == listing_id, Listing.tenant_id == tenant_id)
        )
        listing = (await self.session.execute(stmt)).scalar_one_or_none()
        if not listing:
            raise not_found("Listing")
        return listing

    # ------------------------------------------------------------------
    # Create / Update / Delete
    # ------------------------------------------------------------------

    async def _refetch(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        """Re-query listing with hero_media loaded after a flush."""
        stmt = self._with_hero(
            select(Listing).where(Listing.id == listing_id, Listing.tenant_id == tenant_id)
        )
        return (await self.session.execute(stmt)).scalar_one()

    async def create_listing(
        self, property_id: UUID, tenant_id: UUID, current_user: dict, **fields
    ) -> Listing:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        self._validate_purpose_rent(fields["purpose"], fields.get("rent_period"))
        listing = Listing(property_id=property_id, tenant_id=tenant_id, **fields)
        self.session.add(listing)
        await self.session.flush()
        return await self._refetch(listing.id, tenant_id)

    async def update_listing(
        self, listing_id: UUID, tenant_id: UUID, current_user: dict, updates: dict
    ) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)

        # Block edits when listing is locked for review — unless caller is the reviewer
        if listing.status in LOCKED_FOR_EDIT_STATUSES:
            caller_id = UUID(current_user["id"])
            is_reviewer = listing.assigned_reviewer_id == caller_id
            if not is_reviewer:
                raise bad_request(
                    f"Listing edits are blocked while status is '{listing.status.value}'. "
                    "Only the assigned reviewer may make changes at this stage."
                )

        new_purpose = updates.get("purpose", listing.purpose)
        new_rent = updates.get("rent_period", listing.rent_period)

        if "purpose" in updates and updates["purpose"] == ListingPurpose.SALE:
            new_rent = updates.get("rent_period")
        self._validate_purpose_rent(new_purpose, new_rent)

        allowed = {
            "purpose", "title", "short_description", "description", "currency",
            "rent_period", "listing_tier", "valid_from", "valid_until",
            # "price" excluded — use PATCH /{id}/price (audited price history)
        }
        for k, v in updates.items():
            if k in allowed:
                setattr(listing, k, v)
        if updates.get("purpose") == ListingPurpose.SALE and "rent_period" not in updates:
            listing.rent_period = None

        await self.session.flush()
        return await self._refetch(listing_id, tenant_id)

    async def archive_listing(
        self, listing_id: UUID, tenant_id: UUID, current_user: dict
    ) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)
        listing.status = ListingStatus.ARCHIVED
        await self.session.flush()
        return await self._refetch(listing_id, tenant_id)

    # ------------------------------------------------------------------
    # Lifecycle transitions
    # ------------------------------------------------------------------

    async def _media_exists(self, property_id: UUID) -> bool:
        r = await self.session.execute(
            select(func.count()).where(Media.property_id == property_id)
        )
        return r.scalar_one() > 0

    async def activate(self, listing_id: UUID, tenant_id: UUID, current_user: dict) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)
        if not await self._media_exists(listing.property_id):
            raise bad_request("Property must have at least one media item before activating")
        listing.status = ListingStatus.ACTIVE
        await self.session.flush()
        return await self._refetch(listing_id, tenant_id)

    async def pause(self, listing_id: UUID, tenant_id: UUID, current_user: dict) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)
        listing.status = ListingStatus.PAUSED
        await self.session.flush()
        return await self._refetch(listing_id, tenant_id)

    async def archive(self, listing_id: UUID, tenant_id: UUID, current_user: dict) -> Listing:
        return await self.archive_listing(listing_id, tenant_id, current_user)

    async def change_status(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        new_status: ListingStatus,
        reason_code: str,
        reason_note: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)

        if new_status == ListingStatus.EXPIRED:
            raise bad_request("expired is a system-set status and cannot be set manually")

        if listing.status == new_status:
            raise conflict(f"Listing is already {new_status.value}")

        allowed = _LISTING_ALLOWED_TRANSITIONS.get(listing.status, set())
        if new_status not in allowed:
            raise bad_request(
                f"Transition {listing.status.value} → {new_status.value} is not allowed"
            )

        if new_status == ListingStatus.ACTIVE and not await self._media_exists(listing.property_id):
            raise bad_request("Property must have at least one media item before activating")

        old_status = listing.status
        listing.status = new_status
        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_STATUS_CHANGED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing",
            entity_id=listing.id,
            after={
                "from": old_status.value,
                "to": new_status.value,
                "reason_code": reason_code,
                "reason_note": reason_note,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return await self._refetch(listing_id, tenant_id)

    # ------------------------------------------------------------------
    # Video media validation (called from media router before upload)
    # ------------------------------------------------------------------

    async def validate_video_upload(
        self, property_id: UUID, tenant_id: UUID, file_bytes: bytes, mime_type: str
    ) -> None:
        """Raise bad_request if video limits are exceeded. Delegates to listing_video_validation."""
        await self._set_rls(tenant_id)
        await _validate_video(self.session, property_id, tenant_id, file_bytes, mime_type)
