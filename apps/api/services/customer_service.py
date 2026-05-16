"""Customer service — tenant-scoped CRUD with phone deduplication."""

from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.customer import Customer
from apps.api.models.customer_listing_interest import CustomerListingInterest
from apps.api.models.deal import Deal
from apps.api.models.enums import (
    CustomerListingInterestStatus,
    CustomerStatus,
    PrivateDocumentEntityType,
    TenantRole,
)
from apps.api.models.listing import Listing
from apps.api.models.private_document import PrivateDocument
from apps.api.models.property import Property
from apps.api.services.base import BaseService
from apps.api.utils.phone import normalize_phone
from packages.common.utils.error_handlers import conflict, forbidden, not_found

_CREATE_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
    TenantRole.AGENT.value,
    TenantRole.FINANCE_USER.value,
}
_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class CustomerService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_create(self, role: str) -> None:
        if role not in _CREATE_ROLES:
            raise forbidden("read_only users cannot create customers")

    def _require_admin(self, role: str) -> None:
        if role not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")

    async def _find_by_phone(self, tenant_id: UUID, phone_normalized: str) -> Customer | None:
        stmt = select(Customer).where(
            Customer.tenant_id == tenant_id,
            Customer.phone_normalized == phone_normalized,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_customers(
        self,
        tenant_id: UUID,
        *,
        status: CustomerStatus | None = None,
        assigned_agent_id: UUID | None = None,
        q: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Customer], int]:
        await self._set_rls(tenant_id)
        stmt = select(Customer).where(Customer.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(Customer.status == status)
        if assigned_agent_id:
            stmt = stmt.where(Customer.assigned_agent_id == assigned_agent_id)
        if q:
            pattern = f"{q}%"
            stmt = stmt.where(
                or_(
                    Customer.full_name.ilike(f"%{q}%"),
                    Customer.email.ilike(f"%{q}%"),
                    Customer.phone_normalized.ilike(pattern),
                )
            )
        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        items = list((await self.session.execute(
            stmt.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
        )).scalars().all())
        return items, total

    async def get_customer(self, customer_id: UUID, tenant_id: UUID) -> Customer:
        await self._set_rls(tenant_id)
        c = await self.session.get(Customer, customer_id)
        if not c or c.tenant_id != tenant_id:
            raise not_found("Customer")
        return c

    async def get_customer_detail(self, customer_id: UUID, tenant_id: UUID) -> dict:
        """Return customer + documents + deal history + interested listings."""
        customer = await self.get_customer(customer_id, tenant_id)

        # -- Documents (no storage_key exposed) --
        doc_stmt = select(PrivateDocument).where(
            PrivateDocument.tenant_id == tenant_id,
            PrivateDocument.entity_type == PrivateDocumentEntityType.CUSTOMER,
            PrivateDocument.entity_id == customer_id,
        ).order_by(PrivateDocument.created_at.desc())
        documents = list((await self.session.execute(doc_stmt)).scalars().all())

        # -- Deal history --
        deal_stmt = select(Deal, Property).join(
            Property, Property.id == Deal.property_id
        ).where(
            Deal.tenant_id == tenant_id,
            Deal.customer_id == customer_id,
        ).order_by(Deal.created_at.desc())
        deal_rows = (await self.session.execute(deal_stmt)).all()
        deal_history = []
        for deal, prop in deal_rows:
            deal_history.append({
                "id": deal.id,
                "stage": deal.stage,
                "transaction_value": deal.transaction_value,
                "transaction_currency": deal.transaction_currency,
                "created_at": deal.created_at,
                "closed_at": deal.closed_at,
                "property_title": prop.title if prop else None,
                "listing_id": deal.listing_id,
            })

        # -- Interested listings --
        interest_stmt = select(CustomerListingInterest, Listing).join(
            Listing, Listing.id == CustomerListingInterest.listing_id
        ).where(
            CustomerListingInterest.tenant_id == tenant_id,
            CustomerListingInterest.customer_id == customer_id,
        ).order_by(CustomerListingInterest.created_at.desc())
        interest_rows = (await self.session.execute(interest_stmt)).all()

        interested_listings = []
        for interest, listing in interest_rows:
            won_to_customer_name: str | None = None
            if interest.status == CustomerListingInterestStatus.LOST:
                # Find the winner for this listing
                winner_stmt = select(CustomerListingInterest, Customer).join(
                    Customer, Customer.id == CustomerListingInterest.customer_id
                ).where(
                    CustomerListingInterest.tenant_id == tenant_id,
                    CustomerListingInterest.listing_id == listing.id,
                    CustomerListingInterest.status == CustomerListingInterestStatus.WON,
                )
                winner_row = (await self.session.execute(winner_stmt)).first()
                if winner_row:
                    _, winner_customer = winner_row
                    won_to_customer_name = winner_customer.full_name

            interested_listings.append({
                "listing_id": listing.id,
                "listing_title": listing.title,
                "listing_status": listing.status.value,
                "interest_status": interest.status,
                "linked_at": interest.created_at,
                "notes": interest.notes,
                "won_to_customer_name": won_to_customer_name,
            })

        return {
            "customer": customer,
            "documents": documents,
            "deal_history": deal_history,
            "interested_listings": interested_listings,
        }

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_customer(
        self, tenant_id: UUID, current_user: dict, **fields
    ) -> Customer:
        self._require_create(current_user["role"])
        await self._set_rls(tenant_id)

        phone_normalized = normalize_phone(fields.pop("phone", None))
        if phone_normalized:
            existing = await self._find_by_phone(tenant_id, phone_normalized)
            if existing:
                raise conflict(str(existing.id))  # caller wraps into MergeHintResponse

        customer = Customer(
            tenant_id=tenant_id,
            phone_normalized=phone_normalized,
            created_by_user_id=UUID(current_user["id"]),
            **fields,
        )
        self.session.add(customer)
        await self.session.flush()
        await self.session.refresh(customer)
        return customer

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_customer(
        self, customer_id: UUID, tenant_id: UUID, updates: dict
    ) -> Customer:
        customer = await self.get_customer(customer_id, tenant_id)

        if "phone" in updates:
            new_normalized = normalize_phone(updates.pop("phone"))
            if new_normalized and new_normalized != customer.phone_normalized:
                existing = await self._find_by_phone(tenant_id, new_normalized)
                if existing and existing.id != customer_id:
                    raise conflict(str(existing.id))
            customer.phone_normalized = new_normalized

        allowed = {
            "full_name", "email", "nationality", "language",
            "preferred_currency", "source", "notes", "assigned_agent_id",
        }
        for field, value in updates.items():
            if field in allowed:
                setattr(customer, field, value)

        await self.session.flush()
        await self.session.refresh(customer)
        return customer

    # ------------------------------------------------------------------
    # Delete (soft)
    # ------------------------------------------------------------------

    async def deactivate_customer(
        self, customer_id: UUID, tenant_id: UUID, role: str
    ) -> None:
        self._require_admin(role)
        customer = await self.get_customer(customer_id, tenant_id)
        customer.status = CustomerStatus.INACTIVE
        await self.session.flush()
