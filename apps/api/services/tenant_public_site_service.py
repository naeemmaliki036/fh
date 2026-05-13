"""Tenant public-site settings service (authenticated, owner/admin only).

Handles reading and updating the three public-site columns on the Tenant row,
with audit logging on every change.
"""

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import forbidden, not_found

_ALLOWED_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class TenantPublicSiteService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    def _require_admin(self, role: str) -> None:
        if role not in _ALLOWED_ROLES:
            raise forbidden("company_owner or company_admin required")

    async def _get_tenant(self, tenant_id: UUID) -> Tenant:
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")
        return tenant

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_settings(self, tenant_id: UUID) -> dict:
        """Return public-site settings + computed URL hint."""
        tenant = await self._get_tenant(tenant_id)
        return {
            "slug": tenant.slug,
            "public_site_enabled": tenant.public_site_enabled,
            "public_site_logo_url": tenant.public_site_logo_url,
            "public_site_tagline": tenant.public_site_tagline,
            "public_url_hint": f"/p/{tenant.slug}",
            "config": tenant.public_site_config or {},
        }

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_settings(
        self,
        tenant_id: UUID,
        current_user: dict,
        updates: dict,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """Partial-update public-site fields; RBAC enforced here.

        `config` (a PublicSiteConfig instance) replaces the entire blob when
        present. Audit metadata_after carries a sentinel rather than the full
        blob to keep audit log rows compact.
        """
        self._require_admin(current_user.get("role", ""))

        tenant = await self._get_tenant(tenant_id)

        before = {
            "public_site_enabled": tenant.public_site_enabled,
            "public_site_logo_url": tenant.public_site_logo_url,
            "public_site_tagline": tenant.public_site_tagline,
        }

        _allowed = {"public_site_enabled", "public_site_logo_url", "public_site_tagline"}
        config_updated = False

        for key, val in updates.items():
            if key in _allowed:
                setattr(tenant, key, val)
            elif key == "config" and val is not None:
                # val arrives as a dict (model_dump output from the router).
                # Validation already ran at the Pydantic request-parse stage;
                # persist the dict directly as the new blob.
                tenant.public_site_config = val if isinstance(val, dict) else val.model_dump(exclude_none=False)
                config_updated = True

        await self.session.flush()

        after: dict = {
            "public_site_enabled": tenant.public_site_enabled,
            "public_site_logo_url": tenant.public_site_logo_url,
            "public_site_tagline": tenant.public_site_tagline,
        }
        if config_updated:
            after["config_updated"] = True

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
        return {
            "slug": tenant.slug,
            "public_site_enabled": tenant.public_site_enabled,
            "public_site_logo_url": tenant.public_site_logo_url,
            "public_site_tagline": tenant.public_site_tagline,
            "public_url_hint": f"/p/{tenant.slug}",
            "config": tenant.public_site_config or {},
        }
