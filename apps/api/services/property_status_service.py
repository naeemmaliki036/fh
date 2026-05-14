"""Property status transition service.

Split from property_service.py to stay under 300 LOC.
Handles change_status with off-market gate + sold/rented deal gate.
"""

from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.deal import Deal
from apps.api.models.enums import AuditAction, DealStage, PropertyStatus, TenantRole
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
}

_ALLOWED_TRANSITIONS: dict[PropertyStatus, set[PropertyStatus]] = {
    PropertyStatus.AVAILABLE: {PropertyStatus.OFF_MARKET, PropertyStatus.SOLD, PropertyStatus.RENTED},
    PropertyStatus.OFF_MARKET: {PropertyStatus.AVAILABLE},
}


class PropertyStatusService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def _get_agents(self, property_id: UUID) -> list[PropertyAgent]:
        r = await self.session.execute(
            select(PropertyAgent).where(PropertyAgent.property_id == property_id)
        )
        return list(r.scalars().all())

    async def _media_count(self, property_id: UUID) -> int:
        from apps.api.models.media import Media
        r = await self.session.execute(
            select(func.count()).where(Media.property_id == property_id)
        )
        return r.scalar_one()

    async def _listing_count(self, property_id: UUID) -> int:
        from apps.api.models.listing import Listing
        r = await self.session.execute(
            select(func.count()).where(Listing.property_id == property_id)
        )
        return r.scalar_one()

    async def _has_closed_won_deal(self, property_id: UUID, tenant_id: UUID) -> bool:
        result = await self.session.execute(
            select(func.count()).where(
                Deal.property_id == property_id,
                Deal.tenant_id == tenant_id,
                Deal.stage == DealStage.CLOSED_WON,
            )
        )
        return result.scalar_one() > 0

    async def change_status(
        self,
        property_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        new_status: PropertyStatus,
        reason_code: str,
        reason_note: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        _manual_only = {
            PropertyStatus.AVAILABLE, PropertyStatus.OFF_MARKET,
            PropertyStatus.SOLD, PropertyStatus.RENTED,
        }
        if new_status not in _manual_only:
            raise bad_request(
                f"Status '{new_status.value}' cannot be set manually; "
                "reserved/draft are deal-flow transitions"
            )
        if current_user["role"] not in _MANAGER_ROLES:
            raise forbidden("property_admin, company_admin or company_owner required")

        await self._set_rls(tenant_id)
        prop = await self.session.get(Property, property_id)
        if not prop or prop.tenant_id != tenant_id:
            raise not_found("Property")

        if prop.status == new_status:
            raise conflict(f"Property is already {new_status.value}")

        if new_status == PropertyStatus.OFF_MARKET:
            from apps.api.services.off_market_reason_service import OffMarketReasonService
            omr = await OffMarketReasonService(self.session).resolve_code(reason_code, tenant_id)
            if not omr:
                raise bad_request(f"reason_code '{reason_code}' is not a valid off-market reason for this tenant")
            if omr.requires_note and not reason_note:
                raise bad_request(f"reason_note is required for reason_code '{reason_code}'")

        if new_status in {PropertyStatus.SOLD, PropertyStatus.RENTED}:
            if not await self._has_closed_won_deal(property_id, tenant_id):
                raise bad_request("Create a closed-won deal first")

        allowed = _ALLOWED_TRANSITIONS.get(prop.status, set())
        if new_status not in allowed:
            raise bad_request(
                f"Transition {prop.status.value} → {new_status.value} is not allowed"
            )

        old_status = prop.status
        prop.status = new_status
        await self.session.flush()

        await self._audit.record(
            AuditAction.PROPERTY_STATUS_CHANGED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="property",
            entity_id=prop.id,
            after={
                "from": old_status.value,
                "to": new_status.value,
                "reason_code": reason_code,
                "reason_note": reason_note,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(prop)
        agents = await self._get_agents(property_id)
        return {
            "property": prop,
            "assigned_agents": agents,
            "media_count": await self._media_count(property_id),
            "listing_count": await self._listing_count(property_id),
        }
