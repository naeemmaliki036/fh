"""Deal CRUD + stage transitions service."""

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.customer import Customer
from apps.api.models.deal import Deal
from apps.api.models.enums import AuditAction, DealStage, DealType, TenantRole
from apps.api.models.property import Property
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.utils.commission import compute_commission_amount
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}

_D = DealStage  # alias for compact transition table
_TRANSITIONS: dict[DealStage, set[DealStage]] = {
    _D.INITIATED:         {_D.DOCUMENTS_PENDING, _D.CANCELED, _D.CLOSED_LOST},
    _D.DOCUMENTS_PENDING: {_D.DEPOSIT_PENDING, _D.INITIATED, _D.CANCELED, _D.CLOSED_LOST},
    _D.DEPOSIT_PENDING:   {_D.CLOSED_WON, _D.DOCUMENTS_PENDING, _D.CANCELED, _D.CLOSED_LOST},
    _D.CLOSED_WON:        set(),
    _D.CLOSED_LOST:       set(),
    _D.CANCELED:          set(),
}
_CLOSED = {DealStage.CLOSED_WON, DealStage.CLOSED_LOST, DealStage.CANCELED}
_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value, TenantRole.LISTING_MANAGER.value,
}
_ALL_DEAL_ROLES = _MANAGER_ROLES | {TenantRole.AGENT.value}


class DealService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_deal_role(self, role: str) -> None:
        if role not in _ALL_DEAL_ROLES:
            raise forbidden("Insufficient role to manage deals")

    async def _enrich(self, deal: Deal) -> dict:
        customer = await self.session.get(Customer, deal.customer_id)
        agent = await self.session.get(Agent, deal.primary_agent_id)
        prop = await self.session.get(Property, deal.property_id)
        commission_amount = compute_commission_amount(
            deal.commission_type,
            Decimal(str(deal.commission_value)),
            Decimal(str(deal.transaction_value)),
        )
        return {
            "deal": deal,
            "customer": customer,
            "primary_agent": agent,
            "interest_property": prop,
            "commission_amount": commission_amount,
        }

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_deals(
        self, tenant_id: UUID, *,
        stage: DealStage | None = None, deal_type: DealType | None = None,
        primary_agent_id: UUID | None = None, customer_id: UUID | None = None,
        q: str | None = None, skip: int = 0, limit: int = 50,
    ) -> tuple[list[dict], int]:
        await self._set_rls(tenant_id)
        stmt = select(Deal).where(Deal.tenant_id == tenant_id)
        if stage:
            stmt = stmt.where(Deal.stage == stage)
        if deal_type:
            stmt = stmt.where(Deal.deal_type == deal_type)
        if primary_agent_id:
            stmt = stmt.where(Deal.primary_agent_id == primary_agent_id)
        if customer_id:
            stmt = stmt.where(Deal.customer_id == customer_id)
        if q:
            cust_ids = select(Customer.id).where(
                Customer.tenant_id == tenant_id,
                or_(Customer.full_name.ilike(f"%{q}%"), Customer.phone_normalized.ilike(f"{q}%")),
            )
            stmt = stmt.where(Deal.customer_id.in_(cust_ids))
        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Deal.created_at.desc()).offset(skip).limit(limit)
        )
        deals = list(result.scalars().all())
        return [await self._enrich(d) for d in deals], total

    async def get_deal(self, deal_id: UUID, tenant_id: UUID) -> dict:
        await self._set_rls(tenant_id)
        deal = await self.session.get(Deal, deal_id)
        if not deal or deal.tenant_id != tenant_id:
            raise not_found("Deal")
        return await self._enrich(deal)

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_deal(self, tenant_id: UUID, current_user: dict, **fields) -> dict:
        self._require_deal_role(current_user["role"])
        await self._set_rls(tenant_id)

        agent = await self.session.get(Agent, fields["primary_agent_id"])
        if not agent or agent.tenant_id != tenant_id:
            raise not_found("Agent")

        # Resolve commission
        req_type = fields.pop("commission_type", None)
        req_value = fields.pop("commission_value", None)
        override_reason = fields.pop("commission_override_reason", None)

        if req_type is None and req_value is None:
            commission_type = agent.default_commission_type
            commission_value = Decimal(str(agent.default_commission_value))
            overridden = False
        else:
            commission_type = req_type or agent.default_commission_type
            commission_value = req_value if req_value is not None else Decimal(str(agent.default_commission_value))
            overridden = (
                commission_type != agent.default_commission_type
                or commission_value != Decimal(str(agent.default_commission_value))
            )
            if overridden and not override_reason:
                raise bad_request("commission_override_reason is required when commission differs from agent default")

        primary_pct = fields.pop("primary_commission_pct", 100)
        secondary_pct = fields.pop("secondary_commission_pct", 0)
        if primary_pct + secondary_pct != 100:
            raise bad_request("primary_commission_pct + secondary_commission_pct must equal 100")

        deal = Deal(
            tenant_id=tenant_id,
            commission_type=commission_type,
            commission_value=commission_value,
            commission_overridden=overridden,
            commission_override_reason=override_reason if overridden else None,
            primary_commission_pct=primary_pct,
            secondary_commission_pct=secondary_pct,
            created_by_user_id=UUID(current_user["id"]),
            **fields,
        )
        self.session.add(deal)
        await self.session.flush()

        await self._audit.record(
            AuditAction.OTHER, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="deal", entity_id=deal.id,
            after={"deal_type": deal.deal_type.value, "stage": deal.stage.value},
        )
        if overridden:
            await self._audit.record(
                AuditAction.COMMISSION_OVERRIDDEN, tenant_id=tenant_id,
                actor_user_id=UUID(current_user["id"]),
                entity_type="deal", entity_id=deal.id,
                before={"type": agent.default_commission_type.value, "value": str(agent.default_commission_value)},
                after={"type": commission_type.value, "value": str(commission_value), "reason": override_reason},
            )
        await self.session.refresh(deal)
        return await self._enrich(deal)

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_deal(self, deal_id: UUID, tenant_id: UUID, updates: dict) -> dict:
        data = await self.get_deal(deal_id, tenant_id)
        deal = data["deal"]
        secondary_agent_id = updates.pop("secondary_agent_id", ...)
        primary_pct = updates.pop("primary_commission_pct", None)
        secondary_pct = updates.pop("secondary_commission_pct", None)

        for k, v in updates.items():
            if k in {"notes", "expected_close_at", "listing_id", "transaction_value", "transaction_currency"}:
                setattr(deal, k, v)

        # Handle secondary agent change
        if secondary_agent_id is not ...:
            old_id = deal.secondary_agent_id
            if secondary_agent_id is not None:
                agent = await self.session.get(Agent, secondary_agent_id)
                if not agent or agent.tenant_id != tenant_id:
                    raise not_found("Agent")
            deal.secondary_agent_id = secondary_agent_id
            if old_id != secondary_agent_id:
                await self._audit.record(
                    AuditAction.DEAL_SECONDARY_AGENT_CHANGED, tenant_id=tenant_id,
                    entity_type="deal", entity_id=deal.id,
                    before={"secondary_agent_id": str(old_id) if old_id else None},
                    after={"secondary_agent_id": str(secondary_agent_id) if secondary_agent_id else None},
                )

        # Handle pct split update
        if primary_pct is not None or secondary_pct is not None:
            new_primary = primary_pct if primary_pct is not None else deal.primary_commission_pct
            new_secondary = secondary_pct if secondary_pct is not None else deal.secondary_commission_pct
            if new_primary + new_secondary != 100:
                raise bad_request("primary_commission_pct + secondary_commission_pct must equal 100")
            deal.primary_commission_pct = new_primary
            deal.secondary_commission_pct = new_secondary

        await self.session.flush()
        await self.session.refresh(deal)
        return await self._enrich(deal)

    async def admin_confirm(self, deal_id: UUID, tenant_id: UUID, current_user: dict) -> dict:
        if current_user["role"] not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")
        data = await self.get_deal(deal_id, tenant_id)
        deal = data["deal"]
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
        return await self._enrich(deal)

    async def agent_confirm(self, deal_id: UUID, tenant_id: UUID, current_user: dict) -> dict:
        data = await self.get_deal(deal_id, tenant_id)
        deal = data["deal"]
        user_uuid = UUID(current_user["id"])
        # Resolve the calling user to an agent
        from sqlalchemy import select as sa_select
        from apps.api.models.agent import Agent as AgentModel
        agents_q = await self.session.execute(
            sa_select(AgentModel).where(
                AgentModel.linked_user_id == user_uuid,
                AgentModel.tenant_id == tenant_id,
            )
        )
        agent_row = agents_q.scalars().first()
        if not agent_row:
            raise forbidden("No agent linked to this user account")
        is_primary = agent_row.id == deal.primary_agent_id
        is_secondary = agent_row.id == deal.secondary_agent_id
        if not is_primary and not is_secondary:
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
        return await self._enrich(deal)

    # ------------------------------------------------------------------
    # Stage transition
    # ------------------------------------------------------------------

    async def transition(
        self, deal_id: UUID, tenant_id: UUID, current_user: dict,
        new_stage: DealStage, description: str | None,
    ) -> dict:
        self._require_deal_role(current_user["role"])
        data = await self.get_deal(deal_id, tenant_id)
        deal = data["deal"]
        old_stage = deal.stage
        if new_stage not in _TRANSITIONS.get(old_stage, set()):
            raise bad_request(
                f"Transition '{old_stage.value}' → '{new_stage.value}' is not allowed. "
                f"Legal: {[s.value for s in _TRANSITIONS[old_stage]]}"
            )
        deal.stage = new_stage
        if new_stage in _CLOSED:
            deal.closed_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.flush()
        await self._audit.record(
            AuditAction.DEAL_STAGE_CHANGED, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="deal", entity_id=deal.id,
            before={"stage": old_stage.value},
            after={"stage": new_stage.value, "description": description},
        )
        await self.session.refresh(deal)
        return await self._enrich(deal)
