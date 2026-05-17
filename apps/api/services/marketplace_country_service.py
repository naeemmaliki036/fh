"""MarketplaceCountryService — platform-admin CRUD for marketplace_countries.

No tenant scoping (platform-global table). All audit rows use
actor_platform_user_id and tenant_id=None.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction
from apps.api.models.marketplace_country import MarketplaceCountry
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, not_found


def _row_snapshot(mc: MarketplaceCountry) -> dict:
    """Serialisable snapshot of a MarketplaceCountry row for audit metadata."""
    return {
        "id": str(mc.id),
        "code": mc.code,
        "name": mc.name,
        "flag_emoji": mc.flag_emoji,
        "display_order": mc.display_order,
        "enabled": mc.enabled,
        "hero_image_url": mc.hero_image_url,
    }


class MarketplaceCountryService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def list_all(self) -> tuple[list[MarketplaceCountry], int]:
        """All rows (including disabled), ordered by display_order ASC, code ASC."""
        stmt = (
            select(MarketplaceCountry)
            .order_by(MarketplaceCountry.display_order, MarketplaceCountry.code)
        )
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows), len(rows)

    async def list_enabled(self) -> list[MarketplaceCountry]:
        """Enabled rows only, ordered by display_order ASC, code ASC."""
        stmt = (
            select(MarketplaceCountry)
            .where(MarketplaceCountry.enabled.is_(True))
            .order_by(MarketplaceCountry.display_order, MarketplaceCountry.code)
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def _get_or_404(self, country_id: UUID) -> MarketplaceCountry:
        mc = await self.session.get(MarketplaceCountry, country_id)
        if not mc:
            raise not_found("MarketplaceCountry")
        return mc

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create(
        self, data: dict, actor_id: UUID
    ) -> MarketplaceCountry:
        code = data["code"]
        existing = (
            await self.session.execute(
                select(MarketplaceCountry).where(MarketplaceCountry.code == code)
            )
        ).scalar_one_or_none()
        if existing:
            raise bad_request(f"Country code '{code}' already exists")

        display_order = data.get("display_order")
        if display_order is None:
            max_order = (
                await self.session.execute(
                    select(func.max(MarketplaceCountry.display_order))
                )
            ).scalar_one()
            display_order = (max_order or 0) + 10

        mc = MarketplaceCountry(
            code=code,
            name=data["name"],
            flag_emoji=data["flag_emoji"],
            display_order=display_order,
            enabled=data.get("enabled", True),
            hero_image_url=data.get("hero_image_url"),
        )
        self.session.add(mc)
        await self.session.flush()
        await self._audit.record(
            AuditAction.MARKETPLACE_COUNTRY_CREATED,
            tenant_id=None,
            actor_platform_user_id=actor_id,
            entity_type="marketplace_country",
            entity_id=mc.id,
            after=_row_snapshot(mc),
        )
        await self.session.refresh(mc)
        return mc

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update(
        self, country_id: UUID, updates: dict, actor_id: UUID
    ) -> MarketplaceCountry:
        mc = await self._get_or_404(country_id)
        before = {k: getattr(mc, k) for k in updates}
        for k, v in updates.items():
            setattr(mc, k, v)
        await self.session.flush()
        await self._audit.record(
            AuditAction.MARKETPLACE_COUNTRY_UPDATED,
            tenant_id=None,
            actor_platform_user_id=actor_id,
            entity_type="marketplace_country",
            entity_id=mc.id,
            before={k: str(v) if isinstance(v, UUID) else v for k, v in before.items()},
            after={k: str(v) if isinstance(v, UUID) else v for k, v in updates.items()},
        )
        await self.session.refresh(mc)
        return mc

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete(self, country_id: UUID, actor_id: UUID) -> None:
        mc = await self._get_or_404(country_id)
        snapshot = _row_snapshot(mc)
        await self.session.delete(mc)
        await self.session.flush()
        await self._audit.record(
            AuditAction.MARKETPLACE_COUNTRY_DELETED,
            tenant_id=None,
            actor_platform_user_id=actor_id,
            entity_type="marketplace_country",
            entity_id=country_id,
            before=snapshot,
        )

    # ------------------------------------------------------------------
    # Reorder
    # ------------------------------------------------------------------

    async def reorder(self, ordered_ids: list[UUID], actor_id: UUID) -> None:
        """Set display_order = (index * 10 + 10) for each id in order.

        Raises 422 if any id is unknown. All writes in a single transaction
        (the caller's session). One audit entry per affected row.
        """
        # Fetch all rows first to validate all IDs exist.
        rows: list[MarketplaceCountry] = []
        for uid in ordered_ids:
            mc = await self.session.get(MarketplaceCountry, uid)
            if mc is None:
                raise bad_request(f"Unknown marketplace country id: {uid}")
            rows.append(mc)

        for idx, mc in enumerate(rows):
            new_order = idx * 10 + 10
            before_order = mc.display_order
            mc.display_order = new_order
            await self.session.flush()
            await self._audit.record(
                AuditAction.MARKETPLACE_COUNTRY_UPDATED,
                tenant_id=None,
                actor_platform_user_id=actor_id,
                entity_type="marketplace_country",
                entity_id=mc.id,
                before={"display_order": before_order},
                after={"display_order": new_order},
            )
