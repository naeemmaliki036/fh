"""Email outbox helper — queues transactional emails by inserting into email_outbox.

Used by tenant-lifecycle and platform-user-management services so that the
email module agent can process them via its own worker.  No direct Resend/HTTP
calls here — this is purely a DB insert that the background worker will pick up.

The email module agent owns services/email_service.py and its worker; this file
DOES NOT import from or modify those files.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.email_outbox import EmailOutbox


async def queue_email(
    session: AsyncSession,
    *,
    template_key: str,
    recipient_email: str,
    subject: str,
    body_html: str,
    payload: dict | None = None,
    tenant_id: UUID | None = None,
) -> EmailOutbox:
    """Insert an EmailOutbox row with status='queued'.

    Callers must NOT commit; the calling service owns the transaction so the
    email row and the business event land atomically.
    """
    row = EmailOutbox(
        tenant_id=tenant_id,
        recipient_email=recipient_email,
        template_key=template_key,
        subject_rendered=subject,
        body_html_rendered=body_html,
        status="queued",
        payload_json=payload or {},
        queued_at=datetime.now(UTC).replace(tzinfo=None),
    )
    session.add(row)
    await session.flush()
    return row
