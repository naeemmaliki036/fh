"""OffMarketReason — platform defaults + per-tenant overrides.

NULL tenant_id means platform-level (visible to all tenants).
Tenant rows can only be mutated by company_owner/admin of that tenant.
code is kebab-case and immutable after creation.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class OffMarketReason(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "off_market_reasons"

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_omr_tenant_code"),
    )

    # NULL = platform default (visible to all tenants)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # kebab-case; immutable after creation
    code: Mapped[str] = mapped_column(Text, nullable=False)

    label: Mapped[str] = mapped_column(Text, nullable=False)

    requires_note: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    ordering: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
