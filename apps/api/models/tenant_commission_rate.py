"""TenantCommissionRate model — per-tenant company commission rates.

One row per (tenant, transaction_type) pair.  These rates represent what the
*company* earns on each transaction type — distinct from Agent.default_commission_value
which records the agent's share of the company take.

rate is stored as NUMERIC(5,4), e.g. 0.0200 = 2%.
App-level validation enforces 0.0010 ≤ rate ≤ 0.1000; the DB CHECK only
enforces rate > 0 as a safety net.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import CommissionRateTransactionType

_ev = lambda x: [e.value for e in x]  # noqa: E731


class TenantCommissionRate(Base, UUIDMixin, TimestampMixin, TenantMixin):
    """One row = one company commission rate for a (tenant, transaction_type) pair."""

    __tablename__ = "tenant_commission_rates"

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "transaction_type",
            name="uq_tenant_commission_rates_tenant_type",
        ),
        CheckConstraint("rate > 0", name="ck_tenant_commission_rates_rate_positive"),
    )

    transaction_type: Mapped[CommissionRateTransactionType] = mapped_column(
        Enum(
            CommissionRateTransactionType,
            name="commission_rate_transaction_type",
            create_type=False,
            values_callable=_ev,
        ),
        nullable=False,
    )

    # Stored as NUMERIC(5,4): e.g. 0.0200 = 2%.
    # App layer validates 0.0010 ≤ rate ≤ 0.1000.
    rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Nullable FK to users — tracks the last platform/tenant user who changed this rate.
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
