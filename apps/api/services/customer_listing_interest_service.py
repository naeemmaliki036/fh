"""CustomerListingInterest service — link/unlink customers to open listings.

Business rules
--------------
- A listing must be 'active' or 'draft' (open states) to accept new links.
- At most 10 interested customers per listing (app-level cap, not DB).
- A customer may only be linked once per listing (DB unique constraint).
- Unlink is only allowed while status == 'interested'; won/lost rows are frozen.
- When a deal closes-won, the winning customer's row flips to 'won' and all
  other rows on the same listing flip to 'lost'. Called from DealService.
"""

from uuid import UUID

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.customer import Customer
from apps.api.models.customer_listing_interest import CustomerListingInterest
from apps.api.models.enums import (
    AuditAction,
    CustomerListingInterestStatus,
    ListingStatus,
    TenantRole,
)
from apps.api.models.listing import Listing
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_MAX_INTERESTED = 10
_OPEN_LISTING_STATUSES = {ListingStatus.ACTIVE, ListingStatus.DRAFT}
_LINK_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
    TenantRole.AGENT.value,
}


class CustomerListingInterestService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_role(self, role: str) -> None:
        if role not in _LINK_ROLES:
            raise forbidden("Insufficient role to manage customer listing interests")

    # ------------------------------------------------------------------
    # Link
    # ------------------------------------------------------------------

    async def link(
        self,
        tenant_id: UUID,
        listing_id: UUID,
        customer_id: UUID,
        current_user: dict,
        notes: str | None,
    ) -> CustomerListingInterest:
        self._require_role(current_user["role"])
        await self._set_rls(tenant_id)

        listing = await self.session.get(Listing, listing_id)
        if not listing or listing.tenant_id != tenant_id:
            raise not_found("Listing")
        if listing.status not in _OPEN_LISTING_STATUSES:
            raise bad_request(
                f"Cannot link customers to a listing with status '{listing.status.value}'. "
                "Listing must be 'active' or 'draft'."
            )

        customer = await self.session.get(Customer, customer_id)
        if not customer or customer.tenant_id != tenant_id:
            raise not_found("Customer")

        # Cap check
        count_stmt = select(func.count()).where(
            CustomerListingInterest.tenant_id == tenant_id,
            CustomerListingInterest.listing_id == listing_id,
        )
        current_count = (await self.session.execute(count_stmt)).scalar_one()
        if current_count >= _MAX_INTERESTED:
            raise conflict(
                f"Listing already has {_MAX_INTERESTED} interested customers. "
                "Remove one before adding another."
            )

        row = CustomerListingInterest(
            tenant_id=tenant_id,
            listing_id=listing_id,
            customer_id=customer_id,
            status=CustomerListingInterestStatus.INTERESTED,
            linked_by_user_id=UUID(current_user["id"]),
            notes=notes,
        )
        self.session.add(row)
        try:
            await self.session.flush()
        except Exception as exc:
            # Unique constraint violation — customer already linked
            if "uq_customer_listing_interest" in str(exc).lower():
                raise conflict("Customer is already linked to this listing") from exc
            raise

        await self._audit.record(
            AuditAction.CUSTOMER_LISTING_INTEREST_LINKED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="customer_listing_interest",
            entity_id=row.id,
            after={"listing_id": str(listing_id), "customer_id": str(customer_id)},
        )
        await self.session.refresh(row)
        return row

    # ------------------------------------------------------------------
    # Unlink
    # ------------------------------------------------------------------

    async def unlink(
        self,
        tenant_id: UUID,
        listing_id: UUID,
        customer_id: UUID,
        current_user: dict,
    ) -> None:
        self._require_role(current_user["role"])
        await self._set_rls(tenant_id)

        stmt = select(CustomerListingInterest).where(
            CustomerListingInterest.tenant_id == tenant_id,
            CustomerListingInterest.listing_id == listing_id,
            CustomerListingInterest.customer_id == customer_id,
        )
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise not_found("CustomerListingInterest")
        if row.status != CustomerListingInterestStatus.INTERESTED:
            raise bad_request(
                f"Cannot unlink a customer whose status is '{row.status.value}'. "
                "Only 'interested' rows can be removed."
            )

        await self._audit.record(
            AuditAction.CUSTOMER_LISTING_INTEREST_UNLINKED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="customer_listing_interest",
            entity_id=row.id,
            before={"listing_id": str(listing_id), "customer_id": str(customer_id)},
        )
        await self.session.delete(row)
        await self.session.flush()

    # ------------------------------------------------------------------
    # List for a listing
    # ------------------------------------------------------------------

    async def list_for_listing(
        self,
        tenant_id: UUID,
        listing_id: UUID,
    ) -> list[dict]:
        await self._set_rls(tenant_id)
        stmt = select(CustomerListingInterest, Customer).join(
            Customer, Customer.id == CustomerListingInterest.customer_id
        ).where(
            CustomerListingInterest.tenant_id == tenant_id,
            CustomerListingInterest.listing_id == listing_id,
        ).order_by(CustomerListingInterest.created_at.asc())
        rows = (await self.session.execute(stmt)).all()
        result = []
        for interest, customer in rows:
            result.append({
                "customer_id": customer.id,
                "customer_name": customer.full_name,
                "customer_phone": customer.phone,
                "customer_email": customer.email,
                "status": interest.status,
                "notes": interest.notes,
                "linked_at": interest.created_at,
            })
        return result

    # ------------------------------------------------------------------
    # Deal closed-won side-effect — called from DealService.transition()
    # ------------------------------------------------------------------

    async def handle_deal_closed_won(
        self,
        tenant_id: UUID,
        listing_id: UUID,
        winning_customer_id: UUID,
        actor_user_id: UUID,
    ) -> None:
        """Flip winner to 'won', losers to 'lost'. Inserts winner row if absent."""
        await self._set_rls(tenant_id)

        # Check if winner already has an interest row
        winner_stmt = select(CustomerListingInterest).where(
            CustomerListingInterest.tenant_id == tenant_id,
            CustomerListingInterest.listing_id == listing_id,
            CustomerListingInterest.customer_id == winning_customer_id,
        )
        winner_row = (await self.session.execute(winner_stmt)).scalar_one_or_none()

        if winner_row:
            winner_row.status = CustomerListingInterestStatus.WON
            await self.session.flush()
        else:
            # Insert winner row
            winner_row = CustomerListingInterest(
                tenant_id=tenant_id,
                listing_id=listing_id,
                customer_id=winning_customer_id,
                status=CustomerListingInterestStatus.WON,
                linked_by_user_id=actor_user_id,
            )
            self.session.add(winner_row)
            await self.session.flush()

        await self._audit.record(
            AuditAction.CUSTOMER_LISTING_INTEREST_WON,
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            entity_type="customer_listing_interest",
            entity_id=winner_row.id,
            after={"listing_id": str(listing_id), "customer_id": str(winning_customer_id)},
        )

        # Flip all other 'interested' rows to 'lost'
        losers_stmt = select(CustomerListingInterest).where(
            CustomerListingInterest.tenant_id == tenant_id,
            CustomerListingInterest.listing_id == listing_id,
            CustomerListingInterest.customer_id != winning_customer_id,
            CustomerListingInterest.status == CustomerListingInterestStatus.INTERESTED,
        )
        loser_rows = list((await self.session.execute(losers_stmt)).scalars().all())
        for loser in loser_rows:
            loser.status = CustomerListingInterestStatus.LOST
            await self.session.flush()
            await self._audit.record(
                AuditAction.CUSTOMER_LISTING_INTEREST_LOST,
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                entity_type="customer_listing_interest",
                entity_id=loser.id,
                after={"listing_id": str(listing_id), "lost_to_customer_id": str(winning_customer_id)},
            )
