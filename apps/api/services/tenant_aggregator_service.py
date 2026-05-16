"""Tenant aggregator (marketplace) toggle service.

Extracted from TenantService to stay within the 300 LOC cap.
"""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import not_found


class TenantAggregatorService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _get_tenant(self, tenant_id: UUID) -> Tenant:
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")
        return tenant

    async def set_aggregator_status(
        self,
        tenant_id: UUID,
        actor_id: UUID,
        *,
        enabled: bool,
        reason: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Enable or disable a tenant in the platform marketplace.

        No-op when already in the requested state — still returns 200.
        Audit log entry is written on every actual state change.
        """
        from sqlalchemy import text

        tenant = await self._get_tenant(tenant_id)
        if tenant.aggregator_enabled == enabled:
            return tenant

        before = {
            "aggregator_enabled": tenant.aggregator_enabled,
            "aggregator_disabled_reason": tenant.aggregator_disabled_reason,
        }
        if enabled:
            tenant.aggregator_enabled = True
            tenant.aggregator_disabled_at = None
            tenant.aggregator_disabled_reason = None
            action = AuditAction.TENANT_AGGREGATOR_ENABLED
        else:
            tenant.aggregator_enabled = False
            tenant.aggregator_disabled_at = datetime.now(UTC).replace(tzinfo=None)
            tenant.aggregator_disabled_reason = reason
            action = AuditAction.TENANT_AGGREGATOR_DISABLED

        await self.session.flush()
        after = {
            "aggregator_enabled": tenant.aggregator_enabled,
            "aggregator_disabled_reason": tenant.aggregator_disabled_reason,
        }
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))
        await self._audit.record(
            action,
            tenant_id=tenant_id,
            actor_platform_user_id=actor_id,
            entity_type="tenant",
            entity_id=tenant_id,
            before=before,
            after=after,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(tenant)
        return tenant
