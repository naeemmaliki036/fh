"""AuditLog model — immutable event ledger for the fh platform.

Design decisions:
- No updated_at: audit rows are write-once; only created_at is tracked.
- tenant_id is nullable: platform-level events (e.g. super_admin approving a
  tenant) have no single tenant owner.
- Two actor FK columns: actor_user_id (tenant user) XOR actor_platform_user_id
  (platform operator). Both nullable — system-initiated events have neither.
- metadata_before / metadata_after capture mutable state snapshots. Keep them
  minimal (IDs + changed fields); never store PII like password hashes.
- ip_address uses Postgres INET type for proper IP range queries.

RLS note (see migration 0002):
  The policy admits rows where tenant_id IS NULL or matches app.tenant_id.
  Tenant sessions see their own rows + platform-generated NULL-tenant rows.
  Platform-admin sessions (no app.tenant_id set) see only NULL-tenant rows
  via the missing-GUC fallback — which is correct: they have separate tooling.
"""

import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, UUIDMixin

from .enums import AuditAction

# Shared values_callable for all Enum columns in this module.
_enum_values = lambda x: [e.value for e in x]  # noqa: E731


class AuditLog(Base, UUIDMixin):
    __tablename__ = "audit_logs"

    # Immutable timestamp — no updated_at by design.
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default="now()",
    )

    # Nullable: platform-level events are not scoped to a tenant.
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=False,  # covered by the composite index below
    )

    # One of these two is set; both nullable for system-initiated events.
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=False,  # covered by composite index
    )
    actor_platform_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_users.id", ondelete="SET NULL"),
        nullable=True,
        index=False,  # covered by composite index
    )

    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action", create_type=False,
             values_callable=_enum_values),
        nullable=False,
    )

    # Human-readable entity type, e.g. "tenant", "user", "deal".
    entity_type: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=False
    )

    # State snapshots — store only changed fields, never credentials.
    metadata_before: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )
    metadata_after: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )

    # Request context.
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
