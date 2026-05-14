"""EmailTemplate model — platform or tenant-level transactional email templates.

tenant_id NULL means the template is a platform-level default, available to
all tenants. tenant_id NOT NULL is a per-tenant override of the same key.

Lookup priority (enforced in service layer):
  1. Tenant-specific override if tenant_id matches and active=True.
  2. Platform-level template where tenant_id IS NULL and active=True.

variables is a JSONB doc of available variable names used for documentation
and editor tooling — e.g. {"user_name": "str", "reset_link": "str"}.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class EmailTemplate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "email_templates"

    # NULL = platform-level; NOT NULL = tenant-specific override.
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Machine-readable identifier, e.g. 'welcome', 'tenant_approved'.
    key: Mapped[str] = mapped_column(Text, nullable=False, index=True)

    # Human-readable name for the admin UI.
    name: Mapped[str] = mapped_column(Text, nullable=False)

    subject: Mapped[str] = mapped_column(Text, nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # List of variable names (or map of name → description) for editor hints.
    # Seed data stores a list[str]; future templates may use dict[str, str].
    variables: Mapped[list | dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
