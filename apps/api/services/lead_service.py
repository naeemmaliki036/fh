"""Lead CRUD + stage machine + assignment service."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.customer import Customer
from apps.api.models.enums import CustomerSource, LeadActivityKind, LeadStage, TenantRole
from apps.api.models.lead import Lead
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.services.base import BaseService
from apps.api.services.lead_activity_service import LeadActivityService
from packages.common.utils.error_handlers import bad_request, not_found

# Stage machine — maps each stage to its legal next stages.
_TRANSITIONS: dict[LeadStage, set[LeadStage]] = {
    LeadStage.NEW:       {LeadStage.CONTACTED, LeadStage.LOST},
    LeadStage.CONTACTED: {LeadStage.QUALIFIED, LeadStage.LOST},
    LeadStage.QUALIFIED: {LeadStage.VIEWING, LeadStage.LOST},
    LeadStage.VIEWING:   {LeadStage.OFFER, LeadStage.QUALIFIED, LeadStage.LOST},
    LeadStage.OFFER:     {LeadStage.WON, LeadStage.LOST, LeadStage.VIEWING},
    LeadStage.WON:       set(),
    LeadStage.LOST:      set(),
}
_CLOSED_STAGES = {LeadStage.WON, LeadStage.LOST}
_ALL_ROLES = {r.value for r in TenantRole}
_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class LeadService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._activity = LeadActivityService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    async def _enrich(self, lead: Lead) -> dict:
        """Fetch customer, property, listing for a single lead response."""
        customer = await self.session.get(Customer, lead.customer_id)
        prop = (
            await self.session.get(Property, lead.interest_property_id)
            if lead.interest_property_id else None
        )
        listing = (
            await self.session.get(Listing, lead.interest_listing_id)
            if lead.interest_listing_id else None
        )
        return {"lead": lead, "customer": customer, "interest_property": prop, "interest_listing": listing}

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_leads(
        self,
        tenant_id: UUID,
        *,
        stage: LeadStage | None = None,
        assigned_agent_id: UUID | None = None,
        customer_id: UUID | None = None,
        q: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[dict], int]:
        await self._set_rls(tenant_id)
        stmt = select(Lead).where(Lead.tenant_id == tenant_id)
        if stage:
            stmt = stmt.where(Lead.stage == stage)
        if assigned_agent_id:
            stmt = stmt.where(Lead.assigned_agent_id == assigned_agent_id)
        if customer_id:
            stmt = stmt.where(Lead.customer_id == customer_id)
        if q:
            cust_ids = select(Customer.id).where(
                Customer.tenant_id == tenant_id,
                or_(
                    Customer.full_name.ilike(f"%{q}%"),
                    Customer.email.ilike(f"%{q}%"),
                    Customer.phone_normalized.ilike(f"{q}%"),
                ),
            )
            stmt = stmt.where(Lead.customer_id.in_(cust_ids))
        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        leads = list((await self.session.execute(
            stmt.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
        )).scalars().all())
        result = []
        for lead in leads:
            customer = await self.session.get(Customer, lead.customer_id)
            result.append({"lead": lead, "customer": customer, "interest_property": None, "interest_listing": None})
        return result, total

    async def get_lead(self, lead_id: UUID, tenant_id: UUID) -> dict:
        await self._set_rls(tenant_id)
        lead = await self.session.get(Lead, lead_id)
        if not lead or lead.tenant_id != tenant_id:
            raise not_found("Lead")
        return await self._enrich(lead)

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_lead(
        self, tenant_id: UUID, current_user: dict,
        customer_id: UUID | None,
        inline_customer: dict | None,
        source: CustomerSource,
        **fields,
    ) -> dict:
        if not customer_id and not inline_customer:
            raise bad_request("Either customer_id or customer object is required")
        await self._set_rls(tenant_id)

        if inline_customer:
            from apps.api.services.customer_service import CustomerService
            cust_svc = CustomerService(self.session)
            customer = await cust_svc.create_customer(
                tenant_id, current_user,
                source=inline_customer.get("source") or source,
                **{k: v for k, v in inline_customer.items() if k != "source" and v is not None},
            )
            customer_id = customer.id

        lead = Lead(
            tenant_id=tenant_id,
            customer_id=customer_id,
            source=source,
            created_by_user_id=UUID(current_user["id"]),
            **fields,
        )
        self.session.add(lead)
        await self.session.flush()
        await self._activity.append(
            lead.id, tenant_id, LeadActivityKind.OTHER,
            description=f"Lead created via {source.value}",
        )
        await self.session.refresh(lead)
        return await self._enrich(lead)

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_lead(
        self, lead_id: UUID, tenant_id: UUID, updates: dict
    ) -> dict:
        data = await self.get_lead(lead_id, tenant_id)
        lead = data["lead"]
        allowed = {"notes", "interest_property_id", "interest_listing_id", "next_action_at"}
        for k, v in updates.items():
            if k in allowed:
                setattr(lead, k, v)
        await self.session.flush()
        await self.session.refresh(lead)
        return await self._enrich(lead)

    # ------------------------------------------------------------------
    # Stage transition
    # ------------------------------------------------------------------

    async def transition(
        self, lead_id: UUID, tenant_id: UUID, current_user: dict,
        new_stage: LeadStage, description: str | None,
    ) -> dict:
        data = await self.get_lead(lead_id, tenant_id)
        lead = data["lead"]
        old_stage = lead.stage
        if new_stage not in _TRANSITIONS.get(old_stage, set()):
            raise bad_request(
                f"Transition '{old_stage.value}' → '{new_stage.value}' is not allowed. "
                f"Legal next stages: {[s.value for s in _TRANSITIONS[old_stage]]}"
            )
        lead.stage = new_stage
        if new_stage in _CLOSED_STAGES:
            lead.closed_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.flush()
        await self._activity.append(
            lead.id, tenant_id, LeadActivityKind.STAGE_CHANGED,
            description=description,
            activity_metadata={"from": old_stage.value, "to": new_stage.value},
            actor_user_id=UUID(current_user["id"]),
        )
        await self.session.refresh(lead)
        return await self._enrich(lead)

    # ------------------------------------------------------------------
    # Assignment
    # ------------------------------------------------------------------

    async def assign(
        self, lead_id: UUID, tenant_id: UUID, current_user: dict,
        agent_id: UUID | None,
    ) -> dict:
        data = await self.get_lead(lead_id, tenant_id)
        lead = data["lead"]
        old_agent = str(lead.assigned_agent_id) if lead.assigned_agent_id else None
        lead.assigned_agent_id = agent_id
        if agent_id and not lead.assigned_at:
            lead.assigned_at = datetime.now(UTC).replace(tzinfo=None)
        await self.session.flush()
        await self._activity.append(
            lead.id, tenant_id, LeadActivityKind.ASSIGNMENT_CHANGED,
            activity_metadata={
                "from_agent_id": old_agent,
                "to_agent_id": str(agent_id) if agent_id else None,
            },
            actor_user_id=UUID(current_user["id"]),
        )
        await self.session.refresh(lead)
        return await self._enrich(lead)
