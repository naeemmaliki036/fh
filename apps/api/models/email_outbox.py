"""EmailOutbox model — transactional email delivery queue and audit trail.

Each row represents one outgoing email. The background worker polls for
status='queued' rows, sends via the configured provider, then updates
status/provider_message_id/sent_at. Retries increment attempts and update
last_error.

status lifecycle: queued → sent → delivered | bounced | failed

tenant_id is nullable: platform-level emails (e.g. tenant approval notices
sent to the platform team) have tenant_id=NULL.

payload_json stores the template variables used for rendering — kept for
audit and re-render ability without a re-query.
"""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, UUIDMixin


class EmailOutbox(Base, UUIDMixin):
    __tablename__ = "email_outbox"

    # NULL for platform-level emails not tied to any single tenant.
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    recipient_email: Mapped[str] = mapped_column(Text, nullable=False)
    template_key: Mapped[str] = mapped_column(Text, nullable=False)
    subject_rendered: Mapped[str] = mapped_column(Text, nullable=False)
    body_html_rendered: Mapped[str] = mapped_column(Text, nullable=False)

    # queued / sent / delivered / bounced / failed
    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="queued",
        server_default="queued",
    )

    provider_message_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    payload_json: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    queued_at: Mapped[datetime] = mapped_column(nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(nullable=True)
