"""Listing price-change service — atomic price update + history + audit."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole
from apps.api.models.listing import Listing
from apps.api.models.listing_price_history import ListingPriceHistory
from apps.api.models.media import Media
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import conflict, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}


class ListingPriceService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("listing_manager, property_admin, company_admin or company_owner required")

    async def _get_listing(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        stmt = (
            select(Listing)
            .where(Listing.id == listing_id, Listing.tenant_id == tenant_id)
            .options(selectinload(Listing.hero_media))
        )
        listing = (await self.session.execute(stmt)).scalar_one_or_none()
        if not listing:
            raise not_found("Listing")
        return listing

    # ------------------------------------------------------------------
    # Price change (atomic: update + history + audit)
    # ------------------------------------------------------------------

    async def change_price(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        new_price: Decimal,
        reason_note: str | None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Listing:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        listing = await self._get_listing(listing_id, tenant_id)

        old_price = Decimal(str(listing.price))
        if new_price == old_price:
            raise conflict("Price unchanged — no update performed")

        history = ListingPriceHistory(
            tenant_id=tenant_id,
            listing_id=listing.id,
            old_price=old_price,
            new_price=new_price,
            currency=listing.currency,
            changed_by_user_id=UUID(current_user["id"]),
            reason_note=reason_note,
            changed_at=datetime.now(tz=timezone.utc),
        )
        self.session.add(history)
        listing.price = new_price  # type: ignore[assignment]
        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_PRICE_CHANGED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing",
            entity_id=listing.id,
            before={"price": float(old_price), "currency": listing.currency},
            after={"price": float(new_price), "reason_note": reason_note},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return await self._get_listing(listing_id, tenant_id)

    # ------------------------------------------------------------------
    # Price history read
    # ------------------------------------------------------------------

    async def get_price_history(
        self, listing_id: UUID, tenant_id: UUID
    ) -> tuple[list[ListingPriceHistory], int]:
        await self._set_rls(tenant_id)
        listing = await self._get_listing(listing_id, tenant_id)
        stmt = (
            select(ListingPriceHistory)
            .where(
                ListingPriceHistory.listing_id == listing.id,
                ListingPriceHistory.tenant_id == tenant_id,
            )
            .order_by(ListingPriceHistory.changed_at.desc())
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        return rows, len(rows)

    # ------------------------------------------------------------------
    # Hero media
    # ------------------------------------------------------------------

    async def set_hero_media(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        media_id: UUID | None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Listing:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        listing = await self._get_listing(listing_id, tenant_id)

        if media_id is not None:
            media = await self.session.get(Media, media_id)
            if not media or media.property_id != listing.property_id or media.tenant_id != tenant_id:
                raise not_found("Media")

        old_id = listing.hero_media_id
        listing.hero_media_id = media_id
        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_HERO_MEDIA_SET,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing",
            entity_id=listing.id,
            before={"hero_media_id": str(old_id) if old_id else None},
            after={"hero_media_id": str(media_id) if media_id else None},
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return await self._get_listing(listing_id, tenant_id)
