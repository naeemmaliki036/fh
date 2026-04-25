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

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin


class PropertyAgent(Base, TenantMixin):
    __tablename__ = "property_agents"

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
