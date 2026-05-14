"""Deal commission override + payout service.

Split from deal_service.py to stay under 300 LOC.
"""

import logging
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.deal import Deal
from apps.api.models.enums import AuditAction, CommissionPayoutStatus, CommissionType, DealStage, TenantRole
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.utils.commission import compute_commission_amount
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

log = logging.getLogger("fh.api")

_CLOSED_STAGES = {DealStage.CLOSED_WON, DealStage.CLOSED_LOST, DealStage.CANCELED}
_COMMISSION_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
}


class DealCommissionService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def _get_deal(self, deal_id: UUID, tenant_id: UUID) -> Deal:
        await self._set_rls(tenant_id)
        deal = await self.session.get(Deal, deal_id)
        if not deal or deal.tenant_id != tenant_id:
            raise not_found("Deal")
        return deal

    def _commission_amount(self, deal: Deal) -> Decimal:
        return compute_commission_amount(
            deal.commission_type,
            Decimal(str(deal.commission_value)),
            Decimal(str(deal.transaction_value)),
        )

    # ------------------------------------------------------------------
    # Commission override
    # ------------------------------------------------------------------

    async def override_commission(
        self,
        deal_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        commission_type: CommissionType,
        commission_value: Decimal,
        override_reason: str,
    ) -> Deal:
        if current_user["role"] not in _COMMISSION_ROLES:
            raise forbidden("Only company_owner, company_admin or property_admin can override commission")
        deal = await self._get_deal(deal_id, tenant_id)
        if deal.stage in _CLOSED_STAGES:
            raise bad_request(f"Cannot override commission on a {deal.stage.value} deal")

        before = {"type": deal.commission_type.value, "value": str(deal.commission_value)}
        deal.commission_type = commission_type
        deal.commission_value = commission_value
        deal.commission_overridden = True
        deal.commission_override_reason = override_reason
        await self.session.flush()

        await self._audit.record(
            AuditAction.COMMISSION_OVERRIDDEN,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="deal",
            entity_id=deal.id,
            before=before,
            after={"type": commission_type.value, "value": str(commission_value), "reason": override_reason},
        )
        await self.session.refresh(deal)
        return deal

    # ------------------------------------------------------------------
    # Payout
    # ------------------------------------------------------------------

    async def record_payout(
        self,
        deal_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        amount: Decimal,
        paid_at: datetime | None = None,
    ) -> Deal:
        deal = await self._get_deal(deal_id, tenant_id)
        if deal.agent_confirmed_at is None:
            raise bad_request("Awaiting agent confirmation")
        total = self._commission_amount(deal)
        paid_at_dt = (paid_at or datetime.now(UTC)).replace(tzinfo=None)

        deal.commission_paid_amount = Decimal(str(deal.commission_paid_amount)) + amount
        paid_so_far = Decimal(str(deal.commission_paid_amount))

        if paid_so_far >= total:
            if paid_so_far > total:
                log.warning("Deal %s over-paid: paid=%s total=%s", deal_id, paid_so_far, total)
            deal.commission_payout_status = CommissionPayoutStatus.PAID
            deal.commission_paid_at = paid_at_dt
        elif paid_so_far > 0:
            deal.commission_payout_status = CommissionPayoutStatus.PARTIAL
        await self.session.flush()

        await self._audit.record(
            AuditAction.OTHER,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="deal",
            entity_id=deal.id,
            after={
                "event": "commission_payout",
                "amount": str(amount),
                "status": deal.commission_payout_status.value,
                "after_paid_total": str(paid_so_far),
            },
        )
        await self.session.refresh(deal)
        return deal

    async def cancel_payout(
        self,
        deal_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        reason_note: str | None = None,
    ) -> Deal:
        deal = await self._get_deal(deal_id, tenant_id)
        deal.commission_payout_status = CommissionPayoutStatus.CANCELED
        await self.session.flush()
        await self._audit.record(
            AuditAction.OTHER,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="deal",
            entity_id=deal.id,
            after={
                "event": "commission_payout_canceled",
                "reason_note": reason_note,
            },
        )
        await self.session.refresh(deal)
        return deal
