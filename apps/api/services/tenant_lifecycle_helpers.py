"""Tenant lifecycle side-effects: email queuing and platform notification fan-out.

Extracted from TenantService to stay under the 300 LOC file cap.
Called exclusively by TenantService — not a public API.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.tenant import Tenant

_log = logging.getLogger("fh.tenant.helpers")


async def queue_tenant_lifecycle_email(
    session: AsyncSession,
    *,
    tenant: Tenant,
    template_key: str,
    subject: str,
    body_html: str,
) -> None:
    """Queue a transactional email to the tenant's contact address (fail-soft).

    Inserts an EmailOutbox row within the caller's transaction.
    Failures are logged and swallowed — email delivery is best-effort.
    """
    from apps.api.services.email_outbox_helper import queue_email  # noqa: PLC0415

    try:
        await queue_email(
            session,
            template_key=template_key,
            recipient_email=tenant.contact_email,
            subject=subject,
            body_html=body_html,
            payload={"tenant_id": str(tenant.id), "tenant_name": tenant.name},
            tenant_id=tenant.id,
        )
    except Exception:
        _log.warning(
            "queue_tenant_lifecycle_email: failed for tenant=%s template=%s",
            tenant.id,
            template_key,
            exc_info=True,
        )


async def fan_out_platform_notification(
    session: AsyncSession,
    *,
    event_type: str,
    title: str,
    body: str,
    tenant_id: UUID,
) -> None:
    """Fan-out an in-app notification to all platform users (fail-soft)."""
    from apps.api.services.notification_service import NotificationService  # noqa: PLC0415

    try:
        notif_svc = NotificationService(session)
        await notif_svc.create_for_all_platform_users(
            event_type=event_type,
            title=title,
            body=body,
            link_path=f"/tenants/{tenant_id}",
            payload={"tenant_id": str(tenant_id)},
        )
    except Exception:
        _log.warning(
            "fan_out_platform_notification: failed for tenant=%s event=%s",
            tenant_id,
            event_type,
            exc_info=True,
        )
