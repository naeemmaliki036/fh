"""Lead model — tracks a customer's journey through the sales pipeline.

`source` reuses the existing `customer_source` Postgres enum — no new type.
`stage` drives the pipeline view; transitions are recorded in lead_activities.

next_action_at is indexed via a partial unique (WHERE NOT NULL) so the
"due follow-ups" query only scans rows that actually have a due date.

A lead can reference both interest_property_id and interest_listing_id:
- property only: customer is interested in the asset, no specific listing
- both: customer came via a specific portal listing

closed_at is set by the service layer when stage transitions to won or lost.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import CustomerSource, LeadStage

_ev = lambda x: [e.value for e in x]  # noqa: E731


class Lead(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "leads"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Reuses customer_source Postgres enum — create_type=False, no new type.
    source: Mapped[CustomerSource] = mapped_column(
        Enum(CustomerSource, name="customer_source", create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    stage: Mapped[LeadStage] = mapped_column(
        Enum(LeadStage, name="lead_stage", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=LeadStage.NEW,
        server_default=LeadStage.NEW.value,
    )

    assigned_agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Property/listing the customer expressed interest in.
    interest_property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="SET NULL"),
        nullable=True,
    )
    interest_listing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="SET NULL"),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Partial-indexed (WHERE NOT NULL) — follow-up reminder queries.
    next_action_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Set by service layer on won/lost transition.
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
