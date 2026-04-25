"""Deal model — the closed/closing transaction for a property.

Commission is embedded in Phase 1 for simplicity.  If Phase 3 requires
split commissions (e.g., two agents sharing one deal), extract commission
into a separate table at that point.

Commission chain rule (CLAUDE.md §4):
  1. Agent.default_commission_* is copied here at deal creation.
  2. commission_overridden is set true + commission_override_reason required
     when the value differs from agent default.
  3. Every override must produce an AuditLog entry with action=COMMISSION_OVERRIDDEN.
  Backend-dev owns steps 2–3; the columns here are the foundation.

deal_type is a distinct enum from listing_purpose even though values overlap.
A listing_purpose describes intent (advertising); a deal_type describes the
executed transaction.  Keep them separate — semantics diverge when, e.g.,
a rental deal spans multiple listing periods.

closed_at is set by the service layer on closed_won or closed_lost transition.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import CommissionPayoutStatus, CommissionType, DealStage, DealType

_ev = lambda x: [e.value for e in x]  # noqa: E731


class Deal(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "deals"

    deal_type: Mapped[DealType] = mapped_column(
        Enum(DealType, name="deal_type", create_type=False, values_callable=_ev),
        nullable=False,
    )

    # ON DELETE RESTRICT — deals must not vanish when a customer is deleted.
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
    )

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Nullable: listing may be archived after the deal closes.
    listing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="SET NULL"),
        nullable=True,
    )

    primary_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="RESTRICT"),
        nullable=False,
    )

    lead_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
    )

    stage: Mapped[DealStage] = mapped_column(
        Enum(DealStage, name="deal_stage", create_type=False, values_callable=_ev),
        nullable=False,
        default=DealStage.INITIATED,
        server_default=DealStage.INITIATED.value,
    )

    # Transaction value — sale price or annual rent amount.
    transaction_value: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    transaction_currency: Mapped[str] = mapped_column(String(8), nullable=False)

    expected_close_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ------------------------------------------------------------------
    # Commission fields — copied from agent defaults at creation.
    # ------------------------------------------------------------------

    # Reuses commission_type enum from agents (migration 0003).
    commission_type: Mapped[CommissionType] = mapped_column(
        Enum(CommissionType, name="commission_type", create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    # Percentage (e.g. 2.5000) or fixed amount in transaction_currency.
    commission_value: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)

    # True when value differs from agent default OR after a POST override.
    commission_overridden: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # Required at API layer when commission_overridden=true; stored for audit.
    commission_override_reason: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    commission_payout_status: Mapped[CommissionPayoutStatus] = mapped_column(
        Enum(CommissionPayoutStatus, name="commission_payout_status",
             create_type=False, values_callable=_ev),
        nullable=False,
        default=CommissionPayoutStatus.PENDING,
        server_default=CommissionPayoutStatus.PENDING.value,
    )

    # Running total paid; updated as payments are recorded.
    commission_paid_amount: Mapped[float] = mapped_column(
        Numeric(14, 2), nullable=False, default=0, server_default="0"
    )

    commission_paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
