"""Agent model — tenant-scoped agent record.

An agent may or may not have a user account (linked_user_id is nullable).
Commission defaults here are copied to each Deal at creation time; overrides
are recorded at the deal level with an AuditLog entry.

photo_key stores the Cloudflare R2 object key (public media bucket).
The full URL is assembled by the service layer using the CDN base URL from
config — never store absolute URLs here.
"""

import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import AgentStatus, CommissionType

_ev = lambda x: [e.value for e in x]  # noqa: E731  values_callable shorthand


class Agent(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "agents"

    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_agents_tenant_email"),
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    email: Mapped[str] = mapped_column(String(255), nullable=False)

    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Cloudflare R2 object key — assembled into a CDN URL by the service layer.
    photo_key: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # License / RERA ID — no global unique constraint; varies by market.
    license_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    license_expiry_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[AgentStatus] = mapped_column(
        Enum(AgentStatus, name="agent_status", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=AgentStatus.ACTIVE,
        server_default=AgentStatus.ACTIVE.value,
    )

    default_commission_type: Mapped[CommissionType] = mapped_column(
        Enum(CommissionType, name="commission_type", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=CommissionType.PERCENTAGE,
        server_default=CommissionType.PERCENTAGE.value,
    )

    # Stored as Numeric(12,4): e.g. 2.5000 = 2.5% or 5000.0000 AED fixed.
    default_commission_value: Mapped[float] = mapped_column(
        Numeric(12, 4),
        nullable=False,
        default=0,
        server_default="0",
    )

    # Optional link to a user account (agent logging in to the platform).
    linked_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
