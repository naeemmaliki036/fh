"""LeadActivity model — append-only timeline for a lead.

Activities are immutable once written; do not expose update/delete endpoints.
The `metadata` JSONB column holds structured context per kind, e.g.:
  stage_changed:      {"from": "new", "to": "contacted"}
  assignment_changed: {"from_agent_id": "...", "to_agent_id": "..."}
  viewing_scheduled:  {"scheduled_at": "2026-05-01T10:00:00Z"}

actor_user_id is NULL for system-generated events (e.g. automated stage
transitions triggered by a lead form submission).
"""

import uuid

from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import LeadActivityKind

_ev = lambda x: [e.value for e in x]  # noqa: E731


class LeadActivity(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "lead_activities"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
    )

    kind: Mapped[LeadActivityKind] = mapped_column(
        Enum(LeadActivityKind, name="lead_activity_kind", create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    # Human-readable summary typed by the user; NULL for system events.
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured context for the activity kind (see module docstring).
    # Named activity_metadata — 'metadata' is reserved by SQLAlchemy DeclarativeBase.
    activity_metadata: Mapped[dict | None] = mapped_column(
        "metadata", JSONB, nullable=True
    )

    # NULL when the event was system-generated.
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
