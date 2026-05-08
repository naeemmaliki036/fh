"""Notification model — per-recipient fan-out for platform-scoped events.

One row is created per platform_user per event so each admin can mark-read
independently. NOT tenant-scoped (no tenant_id, no RLS) — these are
notifications for platform operators (Super Admin, Operations Admin, etc.).
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default="gen_random_uuid()",
    )

    # The platform admin who should receive this notification.
    recipient_platform_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # String — not an enum — intentionally easy to extend without migrations.
    # E.g.: 'tenant_registered', 'tenant_approved', 'tenant_suspended', 'tenant_activated'
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Relative path for the bell link, e.g. /tenants/<id>. NULL = no link.
    link_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Structured event data for future programmatic use. NULL until populated.
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # NULL means unread. Set to the timestamp when the recipient marks it read.
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )
