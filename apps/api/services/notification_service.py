"""Notification service — platform-scoped fan-out and per-user reads.

Notifications are NOT tenant-scoped: no RLS, no SET LOCAL app.tenant_id.
All operations target the platform_users + notifications tables directly.
"""

import asyncio
import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.notification import Notification
from apps.api.models.platform_user import PlatformUser
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import not_found

_log = logging.getLogger("fh.notifications")


class NotificationService(BaseService):
    """Handles creation, listing, and read-state for platform notifications."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Write path
    # ------------------------------------------------------------------

    async def create_for_all_platform_users(
        self,
        event_type: str,
        title: str,
        body: str,
        link_path: str | None = None,
        payload: dict[str, object] | None = None,
    ) -> list[Notification]:
        """Fan-out: insert one Notification per active platform_user.

        Also sends an email to each recipient concurrently (fail-soft).
        Returns the inserted rows (ids are populated after flush).
        """
        stmt = select(PlatformUser)
        result = await self.session.execute(stmt)
        platform_users = list(result.scalars().all())

        rows: list[Notification] = []
        for pu in platform_users:
            row = Notification(
                recipient_platform_user_id=pu.id,
                event_type=event_type,
                title=title,
                body=body,
                link_path=link_path,
                payload=payload,
            )
            self.session.add(row)
            rows.append(row)

        if rows:
            await self.session.flush()

        # Concurrent email fan-out — failures must never abort notification creation.
        if platform_users:
            await self._send_emails(platform_users, title=title, body=body)

        return rows

    async def _send_emails(
        self,
        platform_users: list[PlatformUser],
        *,
        title: str,
        body: str,
    ) -> None:
        """Send notification emails to all recipients concurrently (fail-soft)."""
        from apps.api.services.email_service import send_email

        html_body = f"<p>{body}</p>"
        tasks = [
            send_email(to=pu.email, subject=title, html=html_body, text=body)
            for pu in platform_users
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for pu, res in zip(platform_users, results, strict=False):
            if isinstance(res, Exception):
                _log.warning(
                    "notification email failed: to=%s error=%s", pu.email, res
                )

    # ------------------------------------------------------------------
    # Read path
    # ------------------------------------------------------------------

    async def list_for_user(
        self,
        platform_user_id: UUID,
        *,
        limit: int = 20,
        before_id: UUID | None = None,
    ) -> list[Notification]:
        """Return notifications for a recipient, newest-first.

        Uses keyset pagination: pass before_id to get the page before that row's
        created_at. The before_id row itself is excluded.
        """
        stmt = (
            select(Notification)
            .where(Notification.recipient_platform_user_id == platform_user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )

        if before_id is not None:
            # Fetch the cursor row's created_at for keyset comparison.
            anchor = await self.session.get(Notification, before_id)
            if anchor is not None:
                stmt = stmt.where(Notification.created_at < anchor.created_at)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def unread_count(self, platform_user_id: UUID) -> int:
        """Return the number of unread notifications for a recipient."""
        from sqlalchemy import func

        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.recipient_platform_user_id == platform_user_id,
                Notification.read_at.is_(None),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def mark_read(self, platform_user_id: UUID, notification_id: UUID) -> None:
        """Mark a single notification as read. Idempotent. 404 if not found."""
        row = await self.session.get(Notification, notification_id)
        if row is None or row.recipient_platform_user_id != platform_user_id:
            raise not_found("Notification")
        if row.read_at is None:
            row.read_at = datetime.now(UTC)
            await self.session.flush()

    async def mark_all_read(self, platform_user_id: UUID) -> int:
        """Bulk-mark all unread notifications for a recipient as read.

        Returns the number of rows updated.
        """
        now = datetime.now(UTC)
        stmt = (
            update(Notification)
            .where(
                Notification.recipient_platform_user_id == platform_user_id,
                Notification.read_at.is_(None),
            )
            .values(read_at=now)
        )
        result = await self.session.execute(stmt)
        # CursorResult carries rowcount; the generic Result type doesn't expose it,
        # hence the cast.
        from sqlalchemy.engine import CursorResult  # noqa: PLC0415

        if isinstance(result, CursorResult):
            return int(result.rowcount)
        return 0
