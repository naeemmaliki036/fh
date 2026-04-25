"""Listing CRUD + lifecycle service."""

from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import ListingPurpose, ListingStatus, TenantRole
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}
_RENT_PURPOSES = {ListingPurpose.RENT_SHORT, ListingPurpose.RENT_LONG}


class ListingService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

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

    async def list_for_property(
        self, property_id: UUID, tenant_id: UUID
    ) -> tuple[list[Listing], int]:
        await self._set_rls(tenant_id)
        stmt = select(Listing).where(
            Listing.property_id == property_id, Listing.tenant_id == tenant_id
        )
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, len(items)

    async def get_listing(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        await self._set_rls(tenant_id)
        listing = await self.session.get(Listing, listing_id)
        if not listing or listing.tenant_id != tenant_id:
            raise not_found("Listing")
        return listing

    # ------------------------------------------------------------------
    # Create / Update / Delete
    # ------------------------------------------------------------------

    async def create_listing(
        self, property_id: UUID, tenant_id: UUID, current_user: dict, **fields
    ) -> Listing:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        self._validate_purpose_rent(fields["purpose"], fields.get("rent_period"))
        listing = Listing(property_id=property_id, tenant_id=tenant_id, **fields)
        self.session.add(listing)
        await self.session.flush()
        await self.session.refresh(listing)
        return listing

    async def update_listing(
        self, listing_id: UUID, tenant_id: UUID, current_user: dict, updates: dict
    ) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)

        new_purpose = updates.get("purpose", listing.purpose)
        new_rent = updates.get("rent_period", listing.rent_period)

        # If purpose changes to sale, auto-clear rent_period unless explicitly provided
        if "purpose" in updates and updates["purpose"] == ListingPurpose.SALE:
            new_rent = updates.get("rent_period")  # honour explicit null
        self._validate_purpose_rent(new_purpose, new_rent)

        allowed = {
            "purpose", "title", "description", "price", "currency",
            "rent_period", "listing_tier", "valid_from", "valid_until",
        }
        for k, v in updates.items():
            if k in allowed:
                setattr(listing, k, v)
        # Sync rent_period when purpose changed to sale
        if updates.get("purpose") == ListingPurpose.SALE and "rent_period" not in updates:
            listing.rent_period = None

        await self.session.flush()
        await self.session.refresh(listing)
        return listing

    async def archive_listing(
        self, listing_id: UUID, tenant_id: UUID, current_user: dict
    ) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)
        listing.status = ListingStatus.ARCHIVED
        await self.session.flush()
        return listing

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
        return listing

    async def pause(self, listing_id: UUID, tenant_id: UUID, current_user: dict) -> Listing:
        self._require_manager(current_user["role"])
        listing = await self.get_listing(listing_id, tenant_id)
        listing.status = ListingStatus.PAUSED
        await self.session.flush()
        return listing

    async def archive(self, listing_id: UUID, tenant_id: UUID, current_user: dict) -> Listing:
        return await self.archive_listing(listing_id, tenant_id, current_user)
