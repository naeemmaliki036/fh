"""CustomerListingInterest model — agent-curated customer ↔ listing linkage.

An agent "links" one or more interested customers to an open listing so that
deal workflow can track who competed for each unit.

10-customer cap per listing
---------------------------
The DB does NOT enforce a maximum number of interested customers per listing.
The cap of 10 is an application-level rule enforced in the service layer before
INSERT.  Rationale: CHECK constraints cannot easily count rows in another table
without a trigger, and triggers add migration complexity for a business rule that
may evolve.

Uniqueness
----------
A customer may only be linked once per listing within a tenant.  The composite
UNIQUE constraint (tenant_id, customer_id, listing_id) is declared here and
mirrored in the migration.

Outcome transitions
-------------------
When a deal closes against the listing:
  - The winning customer's status flips to 'won'.
  - All other interested customers for that listing flip to 'lost'.
These transitions are orchestrated by the deal-close service, not the DB.
"""

import uuid

from sqlalchemy import Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import CustomerListingInterestStatus

_ev = lambda x: [e.value for e in x]  # noqa: E731


class CustomerListingInterest(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "customer_listing_interest"

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "customer_id",
            "listing_id",
            name="uq_customer_listing_interest_tenant_customer_listing",
        ),
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[CustomerListingInterestStatus] = mapped_column(
        Enum(
            CustomerListingInterestStatus,
            name="customer_listing_interest_status",
            create_type=False,
            values_callable=_ev,
        ),
        nullable=False,
        default=CustomerListingInterestStatus.INTERESTED,
        server_default=CustomerListingInterestStatus.INTERESTED.value,
    )

    # Who performed the link action — nullable so the row survives user deletion.
    linked_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
