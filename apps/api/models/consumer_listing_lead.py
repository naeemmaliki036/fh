"""ConsumerListingLead model — buyer inquiries on consumer-posted listings.

Hybrid contact-reveal pattern: a prospective buyer submits this form, which
notifies the listing owner (consumer). The seller's contact details are only
revealed to the buyer after they submit the inquiry (contact_revealed_at records
when that happened). seller_notified_at records when we dispatched the email.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, UUIDMixin


class ConsumerListingLead(Base, UUIDMixin):
    """One row per buyer inquiry on a consumer-posted listing."""

    __tablename__ = "consumer_listing_leads"

    __table_args__ = (
        Index(
            "idx_consumer_listing_leads_consumer",
            "consumer_account_id",
            "created_at",
        ),
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The listing owner (seller), not the buyer.
    consumer_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("consumer_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )

    buyer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    buyer_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    buyer_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps for the contact-reveal workflow.
    contact_revealed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    seller_notified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
