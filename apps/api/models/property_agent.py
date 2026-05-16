"""PropertyAgent — M2M join table between properties and agents.

Composite PK (property_id, agent_id) — no surrogate UUID needed here.
At most one primary agent per property is enforced via a partial unique index
in the migration: UNIQUE (property_id) WHERE is_primary = true.

tenant_id is included (via TenantMixin) so RLS can filter the join table
without joining back to properties. It must always match property.tenant_id;
the service layer enforces this cross-column constraint.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin

from .enums import CommissionType


class PropertyAgent(Base, TenantMixin):
    __tablename__ = "property_agents"
    __table_args__ = (
        # Both columns must be set together or both must be NULL.
        CheckConstraint(
            "(commission_override_type IS NULL AND commission_override_value IS NULL)"
            " OR "
            "(commission_override_type IS NOT NULL AND commission_override_value IS NOT NULL)",
            name="ck_property_agents_commission_override_both_or_neither",
        ),
    )

    # Composite PK — no UUIDMixin.
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # Assignment timestamp — no updated_at; use a new row if reassigned.
    assigned_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default="now()"
    )

    # Per-property commission override — both must be set or both NULL.
    # When set, takes precedence over the agent's default commission config.
    commission_override_type: Mapped[CommissionType | None] = mapped_column(
        PG_ENUM(
            *[e.value for e in CommissionType],
            name="commission_type",
            create_type=False,
        ),
        nullable=True,
    )
    commission_override_value: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
