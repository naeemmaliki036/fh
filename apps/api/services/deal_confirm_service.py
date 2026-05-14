"""Deal confirmation workflow — admin + agent dual-confirmation.

Split from deal_service.py to keep under 300 LOC.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.deal import Deal
from apps.api.models.enums import AuditAction, DealStage, TenantRole
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class DealConfirmService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _get_deal(self, deal_id: UUID, tenant_id: UUID) -> Deal:
        deal = await self.session.get(Deal, deal_id)
        if not deal or deal.tenant_id != tenant_id:
            raise not_found("Deal")
        return deal

    async def admin_confirm(self, deal_id: UUID, tenant_id: UUID, current_user: dict) -> Deal:
        if current_user["role"] not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")
        deal = await self._get_deal(deal_id, tenant_id)
        if deal.stage != DealStage.CLOSED_WON:
            raise bad_request("Deal must be in closed_won stage to confirm")
        deal.admin_confirmed_at = datetime.now(UTC).replace(tzinfo=None)
        deal.admin_confirmed_by_user_id = UUID(current_user["id"])
        await self.session.flush()
        await self._audit.record(
            AuditAction.DEAL_ADMIN_CONFIRMED, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="deal", entity_id=deal.id,
            after={"admin_confirmed_at": deal.admin_confirmed_at.isoformat()},
        )
        await self.session.refresh(deal)
        return deal

    async def agent_confirm(self, deal_id: UUID, tenant_id: UUID, current_user: dict) -> Deal:
        deal = await self._get_deal(deal_id, tenant_id)
        user_uuid = UUID(current_user["id"])
        agents_q = await self.session.execute(
            select(Agent).where(
                Agent.linked_user_id == user_uuid,
                Agent.tenant_id == tenant_id,
            )
        )
        agent_row = agents_q.scalars().first()
        if not agent_row:
            raise forbidden("No agent linked to this user account")
        if agent_row.id not in (deal.primary_agent_id, deal.secondary_agent_id):
            raise forbidden("Only the primary or secondary agent of this deal can confirm")
        if deal.admin_confirmed_at is None:
            raise bad_request("Awaiting admin confirmation first")
        deal.agent_confirmed_at = datetime.now(UTC).replace(tzinfo=None)
        deal.agent_confirmed_by_user_id = user_uuid
        await self.session.flush()
        await self._audit.record(
            AuditAction.DEAL_AGENT_CONFIRMED, tenant_id=tenant_id,
            actor_user_id=user_uuid,
            entity_type="deal", entity_id=deal.id,
            after={"agent_confirmed_at": deal.agent_confirmed_at.isoformat()},
        )
        await self.session.refresh(deal)
        return deal
