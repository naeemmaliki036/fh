"""Reports service — closed-deal summary queries.

All queries are tenant-scoped. Agents see only their own deals.
"""

from datetime import date
from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.customer import Customer
from apps.api.models.deal import Deal
from apps.api.models.enums import DealStage, DealType, TenantRole
from apps.api.models.property import Property
from apps.api.services.base import BaseService
from apps.api.utils.commission import compute_commission_amount
from packages.common.utils.error_handlers import forbidden

from decimal import Decimal

_REPORT_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.FINANCE_USER.value,
    TenantRole.AGENT.value,
}


class ReportsService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def closed_deals(
        self,
        tenant_id: UUID,
        current_user: dict,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
        agent_id: UUID | None = None,
        deal_type: DealType | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:
        role = current_user["role"]
        if role not in _REPORT_ROLES:
            raise forbidden("Insufficient role to access closed-deals report")

        await self._set_rls(tenant_id)

        stmt = (
            select(Deal, Customer, Property, Agent)
            .join(Customer, Customer.id == Deal.customer_id)
            .join(Property, Property.id == Deal.property_id)
            .join(Agent, Agent.id == Deal.primary_agent_id)
            .where(
                Deal.tenant_id == tenant_id,
                Deal.stage == DealStage.CLOSED_WON,
            )
        )

        if from_date:
            stmt = stmt.where(Deal.closed_at >= from_date)
        if to_date:
            stmt = stmt.where(Deal.closed_at <= to_date)
        if deal_type:
            stmt = stmt.where(Deal.deal_type == deal_type)

        # Agents see only deals where they are primary or secondary agent
        if role == TenantRole.AGENT.value:
            user_agent_id = await self._resolve_agent_id(tenant_id, current_user["id"])
            if user_agent_id:
                stmt = stmt.where(
                    or_(
                        Deal.primary_agent_id == user_agent_id,
                        Deal.secondary_agent_id == user_agent_id,
                    )
                )
        elif agent_id:
            stmt = stmt.where(
                or_(
                    Deal.primary_agent_id == agent_id,
                    Deal.secondary_agent_id == agent_id,
                )
            )

        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(total_stmt)).scalar_one()

        offset = (page - 1) * page_size
        rows = (await self.session.execute(
            stmt.order_by(Deal.closed_at.desc()).offset(offset).limit(page_size)
        )).all()

        # Resolve secondary agents in a single query if any
        sec_agent_ids = {r.Deal.secondary_agent_id for r in rows if r.Deal.secondary_agent_id}
        sec_agents: dict[UUID, Agent] = {}
        if sec_agent_ids:
            sec_rows = (await self.session.execute(
                select(Agent).where(Agent.id.in_(sec_agent_ids))
            )).scalars().all()
            sec_agents = {a.id: a for a in sec_rows}

        items = []
        for row in rows:
            deal: Deal = row.Deal
            customer: Customer = row.Customer
            prop: Property = row.Property
            primary: Agent = row.Agent
            secondary: Agent | None = sec_agents.get(deal.secondary_agent_id) if deal.secondary_agent_id else None

            commission_paid = Decimal(str(deal.commission_paid_amount))

            items.append({
                "deal_id": deal.id,
                "closed_at": deal.closed_at,
                "deal_type": deal.deal_type,
                "transaction_value": Decimal(str(deal.transaction_value)),
                "transaction_currency": deal.transaction_currency,
                "property_id": prop.id,
                "property_title": prop.title,
                "customer_id": customer.id,
                "customer_display_name": customer.full_name,
                "primary_agent_id": primary.id,
                "primary_agent_name": primary.full_name,
                "secondary_agent_id": secondary.id if secondary else None,
                "secondary_agent_name": secondary.full_name if secondary else None,
                "commission_type": deal.commission_type,
                "commission_value": Decimal(str(deal.commission_value)),
                "commission_paid_amount": commission_paid,
            })

        return items, total

    async def _resolve_agent_id(self, tenant_id: UUID, user_id: str) -> UUID | None:
        """Return the agent.id linked to this user_id within the tenant, or None."""
        result = await self.session.execute(
            select(Agent.id).where(
                Agent.tenant_id == tenant_id,
                Agent.linked_user_id == UUID(user_id),
            )
        )
        return result.scalar_one_or_none()
