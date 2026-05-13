"""Platform admin → tenant messaging service.

Queues a custom email to the tenant's company_owner and writes an audit entry.
Only platform super_admin and operations_admin may call this.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.audit_log import AuditLog  # noqa: F401 — used via audit_service
from apps.api.models.enums import AuditAction
from apps.api.models.platform_user import PlatformUser
from apps.api.models.tenant import Tenant
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.email_outbox_helper import queue_email
from packages.common.utils.error_handlers import not_found


class TenantMessageService(BaseService):
    """Send a one-off custom email from a platform admin to a tenant owner."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def send_message(
        self,
        *,
        tenant_id: UUID,
        platform_user_id: UUID,
        subject: str,
        body_text: str,
    ) -> UUID:
        """Enqueue a custom message email and write audit log.

        Returns the EmailOutbox row id.
        """
        # Resolve tenant
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")

        # Resolve platform admin name
        actor = await self.session.get(PlatformUser, platform_user_id)
        platform_admin_name = actor.full_name if actor else "Platform Team"

        # Find the company_owner user for this tenant
        owner = await self._find_owner(tenant_id)
        if not owner:
            raise not_found("Tenant owner user")

        body_html = self._render_html(
            tenant_name=tenant.name,
            owner_name=owner.full_name,
            subject=subject,
            body_text=body_text,
            platform_admin_name=platform_admin_name,
        )

        outbox_row = await queue_email(
            self.session,
            template_key="tenant_custom_message",
            recipient_email=owner.email,
            subject=subject,
            body_html=body_html,
            payload={
                "tenant_name": tenant.name,
                "owner_name": owner.full_name,
                "subject": subject,
                "body_text": body_text,
                "platform_admin_name": platform_admin_name,
            },
            tenant_id=tenant_id,
        )

        await self._audit.record(
            AuditAction.OTHER,
            tenant_id=tenant_id,
            actor_platform_user_id=platform_user_id,
            entity_type="tenant",
            entity_id=tenant_id,
            after={
                "event": "tenant_custom_message",
                "subject": subject,
                "target_user_id": str(owner.id),
            },
        )

        return outbox_row.id

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _find_owner(self, tenant_id: UUID) -> User | None:
        """Return the first company_owner for the tenant, or None."""
        from apps.api.models.enums import TenantRole

        result = await self.session.execute(
            select(User)
            .where(
                User.tenant_id == tenant_id,
                User.role == TenantRole.COMPANY_OWNER,
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _render_html(
        *,
        tenant_name: str,
        owner_name: str,
        subject: str,
        body_text: str,
        platform_admin_name: str,
    ) -> str:
        return (
            f"<h2>{subject}</h2>"
            f"<p>Hi {owner_name},</p>"
            f"<p>{body_text}</p>"
            f"<p>Best regards,<br>{platform_admin_name}</p>"
            f"<p style='color:#888;font-size:12px;'>This message was sent on behalf of "
            f"the platform team to {tenant_name}.</p>"
        )
