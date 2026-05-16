"""Tenant property-reference-prefix update service (migration 0040).

Extracted from tenant_service.py to respect the 300 LOC cap.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, PlatformRole, TenantRole
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import conflict, forbidden, not_found


class TenantPrefixService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _get_tenant(self, tenant_id: UUID) -> Tenant:
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")
        return tenant

    async def update_prefix(
        self,
        tenant_id: UUID,
        current_user: dict,
        new_prefix: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Update tenant's property_ref_prefix.

        Auth: platform ops/super OR tenant company_owner.
        Raises 409 on case-insensitive collision with another tenant.
        """
        role = current_user.get("role")
        is_platform = current_user.get("is_platform", False)
        platform_roles = {r.value for r in PlatformRole}
        allowed_tenant_roles = {TenantRole.COMPANY_OWNER.value}

        if is_platform:
            if role not in platform_roles:
                raise forbidden("Platform admin role required")
        else:
            if role not in allowed_tenant_roles:
                raise forbidden("Only company_owner can update the property reference prefix")

        # Collision check (case-insensitive), exclude this tenant.
        dup = (
            await self.session.execute(
                select(Tenant).where(
                    func.upper(Tenant.property_ref_prefix) == new_prefix.upper(),
                    Tenant.id != tenant_id,
                )
            )
        ).scalar_one_or_none()
        if dup is not None:
            raise conflict(f"Prefix '{new_prefix.upper()}' is already used by another tenant")

        tenant = await self._get_tenant(tenant_id)
        before = {"property_ref_prefix": tenant.property_ref_prefix}
        tenant.property_ref_prefix = new_prefix.upper()
        await self.session.flush()
        after = {"property_ref_prefix": tenant.property_ref_prefix}

        from sqlalchemy import text
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))
        actor_user_id = UUID(current_user["id"]) if not is_platform else None
        actor_platform_user_id = UUID(current_user["id"]) if is_platform else None
        await self._audit.record(
            AuditAction.TENANT_UPDATED,
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            actor_platform_user_id=actor_platform_user_id,
            entity_type="tenant",
            entity_id=tenant_id,
            before=before,
            after=after,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(tenant)
        return tenant
