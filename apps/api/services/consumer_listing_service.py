"""Consumer listing service — CRUD + mark-status for self-posted listings.

PPD tenant UUID resolved once per request. Workflow (submit/approve) lives in
consumer_listing_moderation_service.py. Helpers in consumer_listing_helpers.py.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, ListingPurpose, ListingStatus
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.consumer_listing_helpers import (
    build_consumer_property,
    fetch_listing_media,
    listing_to_dict,
)
from apps.api.services.price_validation_service import PriceValidationService
from packages.common.utils.error_handlers import bad_request, not_found

_MAX_ACTIVE = 10
_ACTIVE_STATUSES = {ListingStatus.ACTIVE, ListingStatus.PAUSED}
_CONSUMER_ALLOWED_MARK = {
    ListingStatus.SOLD, ListingStatus.RENTED,
    ListingStatus.PAUSED, ListingStatus.ACTIVE,
}
# Statuses that block editing (lifecycle-terminal or in-flight)
_EDIT_BLOCKED = {
    ListingStatus.SOLD, ListingStatus.RENTED,
    ListingStatus.ARCHIVED, ListingStatus.EXPIRED,
    ListingStatus.PENDING_REVIEW,
}
_PROP_UPDATE_FIELDS = (
    "city", "area", "bedrooms", "bathrooms", "size_sqft",
    "latitude", "longitude", "amenities", "furnishing_status",
    "completion_status", "ownership_type", "view_orientation",
    "parking_spaces", "floor_level", "handover_year",
    "handover_quarter", "payment_plan", "build_year",
)


class ConsumerListingService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)
        self._ppd_id: UUID | None = None

    async def _resolve_ppd(self) -> UUID:
        if self._ppd_id is not None:
            return self._ppd_id
        row = (
            await self.session.execute(
                select(Tenant.id).where(Tenant.slug == "propertypoint-direct")
            )
        ).scalar_one_or_none()
        if row is None:
            raise RuntimeError("propertypoint-direct tenant not seeded")
        self._ppd_id = row
        return self._ppd_id

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def _validate_price(
        self, country: str, city: str | None, purpose: str,
        currency: str, price: float,
    ) -> None:
        from decimal import Decimal
        await PriceValidationService(self.session).validate(
            country=country, city=city, purpose=purpose,
            currency=currency, amount=Decimal(str(price)),
        )

    # -- Read --

    async def list_my_listings(
        self, consumer_id: UUID, *, page: int, page_size: int
    ) -> dict:
        base = (
            select(Listing, Property)
            .join(Property, Listing.property_id == Property.id)
            .where(Listing.consumer_account_id == consumer_id)
        )
        total = (
            await self.session.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()

        rows = (
            await self.session.execute(
                base.order_by(Listing.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()

        active_count = (
            await self.session.execute(
                select(func.count()).where(
                    Listing.consumer_account_id == consumer_id,
                    Listing.status.in_([s.value for s in _ACTIVE_STATUSES]),
                )
            )
        ).scalar_one()

        items = [listing_to_dict(listing, prop) for listing, prop in rows]
        return {"items": items, "total": int(total), "active_count": int(active_count)}

    async def get_listing(self, consumer_id: UUID, listing_id: UUID) -> dict:
        listing, prop = await self._get_owned(consumer_id, listing_id)
        media_rows = await fetch_listing_media(self.session, prop.id)
        return listing_to_dict(listing, prop, media_rows)

    # -- Create --

    async def create_listing(self, consumer_id: UUID, data: dict) -> dict:
        ppd_id = await self._resolve_ppd()
        await self._set_rls(ppd_id)

        now = datetime.now(UTC)
        active_count = (
            await self.session.execute(
                select(func.count()).where(
                    Listing.consumer_account_id == consumer_id,
                    Listing.status.in_([s.value for s in _ACTIVE_STATUSES]),
                    or_(
                        Listing.expires_at.is_(None),
                        Listing.expires_at > now,
                    ),
                )
            )
        ).scalar_one()
        if active_count >= _MAX_ACTIVE:
            raise bad_request(
                f"Maximum {_MAX_ACTIVE} active listings allowed per consumer"
            )

        try:
            purpose = ListingPurpose(data["purpose"])
        except (KeyError, ValueError):
            raise bad_request("Invalid or missing purpose")

        price_val = data.get("price")
        if price_val is not None:
            await self._validate_price(
                country=data.get("country", "AE"),
                city=data.get("city"),
                purpose=purpose.value,
                currency=(data.get("currency") or "AED").upper(),
                price=price_val,
            )

        prop = await build_consumer_property(
            self.session, ppd_id, consumer_id, data
        )
        self.session.add(prop)
        await self.session.flush()

        listing = Listing(
            tenant_id=ppd_id,
            property_id=prop.id,
            consumer_account_id=consumer_id,
            purpose=purpose,
            title=data["title"],
            description=data.get("description"),
            price=data["price"],
            currency=data.get("currency", "AED"),
            status=ListingStatus.DRAFT,
            expires_at=None,
        )
        self.session.add(listing)
        await self.session.flush()

        await self._audit.record(
            AuditAction.CONSUMER_LISTING_PUBLISHED,
            tenant_id=ppd_id,
            entity_type="listing",
            entity_id=listing.id,
            after={"consumer_id": str(consumer_id), "title": listing.title, "status": "draft"},
        )

        await self.session.refresh(listing)
        await self.session.refresh(prop)
        return listing_to_dict(listing, prop)

    # -- Update --

    async def update_listing(
        self, consumer_id: UUID, listing_id: UUID, data: dict
    ) -> dict:
        ppd_id = await self._resolve_ppd()
        await self._set_rls(ppd_id)

        listing, prop = await self._get_owned(consumer_id, listing_id)

        if listing.status in _EDIT_BLOCKED:
            raise bad_request(f"Cannot edit a listing with status '{listing.status.value}'")

        if "price" in data and data["price"] is not None:
            await self._validate_price(
                country=prop.country,
                city=prop.city,
                purpose=listing.purpose.value if hasattr(listing.purpose, "value") else str(listing.purpose),
                currency=(data.get("currency") or listing.currency or "AED").upper(),
                price=data["price"],
            )

        for field in ("title", "description", "price", "currency"):
            if field in data and data[field] is not None:
                setattr(listing, field, data[field])

        for field in _PROP_UPDATE_FIELDS:
            if field in data and data[field] is not None:
                setattr(prop, field, data[field])

        # State machine: edits to an approved/rejected listing re-enter moderation.
        if listing.status in (ListingStatus.ACTIVE, ListingStatus.CHANGES_REQUESTED):
            listing.status = ListingStatus.PENDING_REVIEW
            listing.submitted_at = datetime.now(UTC)

        await self.session.flush()
        await self.session.refresh(listing)
        await self.session.refresh(prop)
        media_rows = await fetch_listing_media(self.session, prop.id)
        return listing_to_dict(listing, prop, media_rows)

    # -- Delete (soft archive) --

    async def delete_listing(self, consumer_id: UUID, listing_id: UUID) -> None:
        ppd_id = await self._resolve_ppd()
        await self._set_rls(ppd_id)
        listing, _ = await self._get_owned(consumer_id, listing_id)
        listing.status = ListingStatus.ARCHIVED
        await self.session.flush()

    # -- Mark status --

    async def mark_status(
        self, consumer_id: UUID, listing_id: UUID, new_status_str: str
    ) -> dict:
        ppd_id = await self._resolve_ppd()
        await self._set_rls(ppd_id)

        try:
            new_status = ListingStatus(new_status_str)
        except ValueError:
            raise bad_request(f"Invalid status: {new_status_str}")

        if new_status not in _CONSUMER_ALLOWED_MARK:
            raise bad_request(
                "Consumer can only set: sold, rented, paused, active"
            )

        listing, prop = await self._get_owned(consumer_id, listing_id)

        # Guard: cannot mark active unless listing was approved at least once
        if new_status == ListingStatus.ACTIVE and listing.reviewed_at is None:
            raise bad_request(
                "Listing must be approved by a platform admin before it can be set to active"
            )

        listing.status = new_status
        await self.session.flush()
        await self.session.refresh(listing)
        await self.session.refresh(prop)
        media_rows = await fetch_listing_media(self.session, prop.id)
        return listing_to_dict(listing, prop, media_rows)

    # -- Internal helpers --

    async def _get_owned(
        self, consumer_id: UUID, listing_id: UUID
    ) -> tuple[Listing, Property]:
        row = (
            await self.session.execute(
                select(Listing, Property)
                .join(Property, Listing.property_id == Property.id)
                .where(
                    Listing.id == listing_id,
                    Listing.consumer_account_id == consumer_id,
                )
            )
        ).one_or_none()
        if row is None:
            raise not_found("Listing")
        return row[0], row[1]
