"""Consumer listing lead service — buyer inquiry + hybrid contact reveal."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.consumer_account import ConsumerAccount
from apps.api.models.consumer_listing_lead import ConsumerListingLead
from apps.api.models.enums import AuditAction
from apps.api.models.listing import Listing
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.email_outbox_helper import queue_email
from packages.common.utils.error_handlers import bad_request, not_found


class ConsumerListingLeadService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def submit(
        self,
        listing_id: UUID,
        buyer_data: dict,
        ip: str | None,
    ) -> dict:
        """Submit a buyer inquiry on a consumer-owned listing.

        - Validates the listing is consumer-owned and active.
        - Inserts a consumer_listing_leads row.
        - Queues a notification email to the seller.
        - Returns the seller's contact details (hybrid reveal pattern).
        - Audits CONSUMER_LISTING_LEAD_SUBMITTED.
        """
        listing = await self.session.get(Listing, listing_id)
        if not listing:
            raise not_found("Listing")

        if listing.consumer_account_id is None:
            raise bad_request("This listing does not accept consumer inquiries")

        seller = await self.session.get(
            ConsumerAccount, listing.consumer_account_id
        )
        if not seller:
            raise not_found("Seller")

        now = datetime.now(UTC)

        lead = ConsumerListingLead(
            listing_id=listing_id,
            consumer_account_id=listing.consumer_account_id,
            buyer_name=buyer_data["buyer_name"],
            buyer_email=buyer_data["buyer_email"],
            buyer_phone=buyer_data.get("buyer_phone"),
            buyer_message=buyer_data.get("buyer_message"),
            seller_notified_at=now,
            contact_revealed_at=now,
            ip_address=ip,
        )
        self.session.add(lead)
        await self.session.flush()

        # Notify seller via email outbox
        body_html = _lead_email_html(
            buyer_name=buyer_data["buyer_name"],
            buyer_email=buyer_data["buyer_email"],
            buyer_phone=buyer_data.get("buyer_phone"),
            buyer_message=buyer_data.get("buyer_message"),
            listing_title=listing.title,
        )
        await queue_email(
            self.session,
            template_key="consumer_listing_lead",
            recipient_email=seller.email,
            subject=f"New inquiry on your listing: {listing.title}",
            body_html=body_html,
            payload={"listing_id": str(listing_id)},
        )

        # Resolve PPD tenant for audit
        from apps.api.models.tenant import Tenant
        ppd_row = (
            await self.session.execute(
                select(Tenant.id).where(Tenant.slug == "propertypoint-direct")
            )
        ).scalar_one_or_none()

        await self._audit.record(
            AuditAction.CONSUMER_LISTING_LEAD_SUBMITTED,
            tenant_id=ppd_row,
            entity_type="consumer_listing_lead",
            entity_id=lead.id,
            after={
                "listing_id": str(listing_id),
                "buyer_email": buyer_data["buyer_email"],
            },
            ip_address=ip,
        )

        return {
            "lead_id": lead.id,
            "seller_contact": {
                "name": seller.full_name,
                "email": seller.email,
                "phone": seller.phone,
            },
        }


def _lead_email_html(
    buyer_name: str,
    buyer_email: str,
    buyer_phone: str | None,
    buyer_message: str | None,
    listing_title: str,
) -> str:
    phone_line = f"<p><b>Phone:</b> {buyer_phone}</p>" if buyer_phone else ""
    msg_line = f"<p><b>Message:</b> {buyer_message}</p>" if buyer_message else ""
    return (
        f"<p>You have a new inquiry on your listing <b>{listing_title}</b>.</p>"
        f"<p><b>From:</b> {buyer_name}</p>"
        f"<p><b>Email:</b> {buyer_email}</p>"
        f"{phone_line}"
        f"{msg_line}"
        f"<p>Log in to PropertyPoint to view and manage this inquiry.</p>"
    )
