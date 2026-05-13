"""EmailOutbox service — enqueue, process, and retry outgoing emails."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.email_outbox import EmailOutbox
from apps.api.models.email_template import EmailTemplate
from apps.api.services.base import BaseService
from apps.api.services.email_render import render_body_html, render_subject
from packages.common.utils.error_handlers import bad_request, not_found

_log = logging.getLogger("fh.email_outbox")


class EmailOutboxService(BaseService):
    """Manages the email delivery queue."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Internal: resolve template with tenant-first fallback
    # ------------------------------------------------------------------

    async def _resolve_template(
        self,
        template_key: str,
        tenant_id: uuid.UUID | None,
    ) -> EmailTemplate:
        """Prefer tenant-level override, fall back to platform template."""
        if tenant_id:
            stmt = (
                select(EmailTemplate)
                .where(
                    EmailTemplate.key == template_key,
                    EmailTemplate.active.is_(True),
                    EmailTemplate.tenant_id == tenant_id,
                )
                .limit(1)
            )
            result = await self.session.execute(stmt)
            row = result.scalar_one_or_none()
            if row:
                return row

        # Fall back to platform-level
        stmt = (
            select(EmailTemplate)
            .where(
                EmailTemplate.key == template_key,
                EmailTemplate.active.is_(True),
                EmailTemplate.tenant_id.is_(None),
            )
            .limit(1)
        )
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()
        if not row:
            raise bad_request(f"No active template found for key '{template_key}'")
        return row

    # ------------------------------------------------------------------
    # Enqueue
    # ------------------------------------------------------------------

    async def enqueue(
        self,
        *,
        tenant_id: uuid.UUID | None,
        recipient_email: str,
        template_key: str,
        variables: dict,
    ) -> EmailOutbox:
        """Look up template, render, and insert a queued outbox row."""
        tmpl = await self._resolve_template(template_key, tenant_id)
        subject = render_subject(tmpl.subject, variables)
        body_html = render_body_html(tmpl.body_html, variables)

        row = EmailOutbox(
            tenant_id=tenant_id,
            recipient_email=recipient_email,
            template_key=template_key,
            subject_rendered=subject,
            body_html_rendered=body_html,
            status="queued",
            attempts=0,
            payload_json=variables,
            queued_at=datetime.now(UTC).replace(tzinfo=None),
        )
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    # ------------------------------------------------------------------
    # Process pending — called by background worker or manual endpoint
    # ------------------------------------------------------------------

    async def send_pending(self, *, limit: int = 20) -> dict:
        """Pick up to `limit` queued rows, attempt delivery, update status."""
        from apps.api.services.email_service import send_email  # noqa: PLC0415

        stmt = (
            select(EmailOutbox)
            .where(EmailOutbox.status == "queued")
            .order_by(EmailOutbox.queued_at)
            .limit(limit)
        )
        rows = list((await self.session.execute(stmt)).scalars().all())

        sent_count = 0
        failed_count = 0

        for row in rows:
            row.attempts += 1
            try:
                ok = await send_email(
                    to=row.recipient_email,
                    subject=row.subject_rendered,
                    html=row.body_html_rendered,
                )
                if ok:
                    row.status = "sent"
                    row.sent_at = datetime.now(UTC).replace(tzinfo=None)
                    row.last_error = None
                    sent_count += 1
                else:
                    row.status = "failed"
                    row.last_error = "Resend returned non-success response"
                    failed_count += 1
            except Exception as exc:  # noqa: BLE001
                row.status = "failed"
                row.last_error = str(exc)[:500]
                failed_count += 1
                _log.warning("send_pending error: outbox_id=%s error=%s", row.id, exc)

        if rows:
            await self.session.flush()

        return {"attempted": len(rows), "sent": sent_count, "failed": failed_count}

    # ------------------------------------------------------------------
    # Retry
    # ------------------------------------------------------------------

    async def retry(self, *, outbox_id: uuid.UUID) -> EmailOutbox:
        """Reset a failed/sent row back to queued for re-processing."""
        row = await self.session.get(EmailOutbox, outbox_id)
        if row is None:
            raise not_found("EmailOutbox")
        if row.status == "queued":
            raise bad_request("Already queued")
        row.status = "queued"
        row.last_error = None
        await self.session.flush()
        await self.session.refresh(row)
        return row

    # ------------------------------------------------------------------
    # List (admin read)
    # ------------------------------------------------------------------

    async def list_outbox(
        self,
        *,
        status: str | None = None,
        tenant_id: uuid.UUID | None = None,
        from_dt: datetime | None = None,
        to_dt: datetime | None = None,
        limit: int = 50,
        skip: int = 0,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> tuple[list[EmailOutbox], int]:
        stmt = select(EmailOutbox)

        if caller_tenant_id:
            # Tenant user: only own rows
            stmt = stmt.where(EmailOutbox.tenant_id == caller_tenant_id)
        elif tenant_id:
            stmt = stmt.where(EmailOutbox.tenant_id == tenant_id)

        if status:
            stmt = stmt.where(EmailOutbox.status == status)
        if from_dt:
            stmt = stmt.where(EmailOutbox.queued_at >= from_dt)
        if to_dt:
            stmt = stmt.where(EmailOutbox.queued_at <= to_dt)

        count_q = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        stmt = stmt.order_by(EmailOutbox.queued_at.desc()).offset(skip).limit(limit)
        rows = list((await self.session.execute(stmt)).scalars().all())
        return rows, total

    # ------------------------------------------------------------------
    # Get single
    # ------------------------------------------------------------------

    async def get_outbox_item(
        self,
        outbox_id: uuid.UUID,
        *,
        caller_tenant_id: uuid.UUID | None = None,
    ) -> EmailOutbox:
        row = await self.session.get(EmailOutbox, outbox_id)
        if row is None:
            raise not_found("EmailOutbox")
        if caller_tenant_id and row.tenant_id != caller_tenant_id:
            raise not_found("EmailOutbox")
        return row
