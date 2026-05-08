"""Tenant service — platform-level and tenant-level tenant management."""

import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantStatus
from apps.api.models.platform_user import PlatformUser
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import forbidden, not_found

_log = logging.getLogger("fh.tenant")


class TenantService(BaseService):
    """Business logic for tenant lifecycle management."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Platform-level reads
    # ------------------------------------------------------------------

    async def list_tenants(
        self,
        status: TenantStatus | None = None,
    ) -> tuple[list[Tenant], int]:
        """Return all tenants, optionally filtered by status."""
        stmt = select(Tenant)
        if status is not None:
            stmt = stmt.where(Tenant.status == status)
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        return items, len(items)

    async def get_tenant(self, tenant_id: UUID) -> Tenant:
        """Fetch a tenant by id — raises 404 if missing."""
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")
        return tenant

    # ------------------------------------------------------------------
    # Platform-level mutations
    # ------------------------------------------------------------------

    async def approve_tenant(
        self,
        tenant_id: UUID,
        approver_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Set status=active and record who approved."""
        tenant = await self.get_tenant(tenant_id)

        pu = await self.session.get(PlatformUser, approver_id)
        if not pu:
            raise forbidden("Approver is not a valid platform user")

        before = {"status": tenant.status.value, "approved_at": None, "approved_by_id": None}

        tenant.status = TenantStatus.ACTIVE
        tenant.approved_at = datetime.now(UTC).replace(tzinfo=None)
        tenant.approved_by_id = approver_id
        await self.session.flush()

        after = {
            "status": tenant.status.value,
            "approved_at": tenant.approved_at.isoformat(),
            "approved_by_id": str(approver_id),
        }
        # Platform action: tenant_id scoped so the tenant can see it in their trail.
        await self.session.execute(
            text(f"SET LOCAL app.tenant_id = '{tenant_id}'")
        )
        await self._audit.record(
            AuditAction.TENANT_APPROVED,
            tenant_id=tenant_id,
            actor_platform_user_id=approver_id,
            entity_type="tenant",
            entity_id=tenant_id,
            before=before,
            after=after,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        await self.session.refresh(tenant)

        # Notify all platform users that the tenant is now active.
        from apps.api.services.notification_service import NotificationService  # noqa: PLC0415

        try:
            notif_svc = NotificationService(self.session)
            await notif_svc.create_for_all_platform_users(
                event_type="tenant_approved",
                title=f"Tenant approved: {tenant.name}",
                body=f"{tenant.name} has been approved and is now active.",
                link_path=f"/tenants/{tenant_id}",
                payload={"tenant_id": str(tenant_id)},
            )
        except Exception:
            _log.warning("approve_tenant: notification fan-out failed", exc_info=True)

        return tenant

    async def suspend_tenant(
        self,
        tenant_id: UUID,
        actor_id: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Set status=suspended."""
        tenant = await self.get_tenant(tenant_id)
        if tenant.status == TenantStatus.SUSPENDED:
            return tenant

        before = {"status": tenant.status.value}
        tenant.status = TenantStatus.SUSPENDED
        await self.session.flush()

        await self.session.execute(
            text(f"SET LOCAL app.tenant_id = '{tenant_id}'")
        )
        await self._audit.record(
            AuditAction.TENANT_SUSPENDED,
            tenant_id=tenant_id,
            actor_platform_user_id=actor_id,
            entity_type="tenant",
            entity_id=tenant_id,
            before=before,
            after={"status": TenantStatus.SUSPENDED.value},
            ip_address=ip_address,
            user_agent=user_agent,
        )

        await self.session.refresh(tenant)

        # Notify all platform users that the tenant has been suspended.
        from apps.api.services.notification_service import NotificationService  # noqa: PLC0415

        try:
            notif_svc = NotificationService(self.session)
            await notif_svc.create_for_all_platform_users(
                event_type="tenant_suspended",
                title=f"Tenant suspended: {tenant.name}",
                body=f"{tenant.name} has been suspended.",
                link_path=f"/tenants/{tenant_id}",
                payload={"tenant_id": str(tenant_id)},
            )
        except Exception:
            _log.warning("suspend_tenant: notification fan-out failed", exc_info=True)

        return tenant

    # ------------------------------------------------------------------
    # Tenant-self mutations
    # ------------------------------------------------------------------

    async def get_my_tenant(self, tenant_id: UUID) -> Tenant:
        """Return the current user's tenant."""
        return await self.get_tenant(tenant_id)

    async def update_my_tenant(
        self,
        tenant_id: UUID,
        current_user: dict,
        *,
        name: str | None = None,
        currency: str | None = None,
        timezone_: str | None = None,
        locale: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Partial update for company_owner/company_admin only."""
        from apps.api.models.enums import TenantRole

        role = current_user.get("role")
        allowed = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}
        if role not in allowed:
            raise forbidden("Only company_owner or company_admin can update tenant settings")

        tenant = await self.get_tenant(tenant_id)
        before = {
            "name": tenant.name, "currency": tenant.currency,
            "timezone": tenant.timezone, "locale": tenant.locale,
        }

        if name is not None:
            tenant.name = name
        if currency is not None:
            tenant.currency = currency
        if timezone_ is not None:
            tenant.timezone = timezone_
        if locale is not None:
            tenant.locale = locale

        await self.session.flush()
        after = {
            "name": tenant.name, "currency": tenant.currency,
            "timezone": tenant.timezone, "locale": tenant.locale,
        }

        await self.session.execute(
            text(f"SET LOCAL app.tenant_id = '{tenant_id}'")
        )
        await self._audit.record(
            AuditAction.TENANT_UPDATED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="tenant",
            entity_id=tenant_id,
            before=before,
            after=after,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        await self.session.refresh(tenant)
        return tenant
