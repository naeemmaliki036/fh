"""Tenant service — lifecycle mutations + tenant-self settings.

Side-effect helpers live in tenant_lifecycle_helpers.py (300 LOC cap).
"""

import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole, TenantStatus
from apps.api.models.platform_user import PlatformUser
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.email_template_service import EmailTemplateService
from apps.api.services.tenant_lifecycle_helpers import (
    fan_out_platform_notification,
    queue_tenant_lifecycle_email,
)
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_log = logging.getLogger("fh.tenant")


class TenantService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def list_tenants(self, status: TenantStatus | None = None) -> tuple[list[Tenant], int]:
        stmt = select(Tenant)
        if status is not None:
            stmt = stmt.where(Tenant.status == status)
        items = list((await self.session.execute(stmt)).scalars().all())
        return items, len(items)

    async def get_tenant(self, tenant_id: UUID) -> Tenant:
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")
        return tenant

    async def approve_tenant(
        self, tenant_id: UUID, approver_id: UUID,
        ip_address: str | None = None, user_agent: str | None = None,
    ) -> Tenant:
        tenant = await self.get_tenant(tenant_id)
        if tenant.status == TenantStatus.ACTIVE:
            return tenant
        if not await self.session.get(PlatformUser, approver_id):
            raise forbidden("Approver is not a valid platform user")

        before = {"status": tenant.status.value}
        tenant.status = TenantStatus.ACTIVE
        tenant.approved_at = datetime.now(UTC).replace(tzinfo=None)
        tenant.approved_by_id = approver_id
        tenant.suspended_at = None
        tenant.suspended_reason = None
        tenant.suspended_by_platform_user_id = None
        await self.session.flush()
        after = {"status": tenant.status.value, "approved_by_id": str(approver_id)}
        await self._rls_and_audit(tenant_id, AuditAction.TENANT_APPROVED, approver_id, before, after, ip_address, user_agent)
        await self.session.refresh(tenant)
        seeded = await EmailTemplateService(self.session).seed_tenant_templates(tenant.id)
        if seeded:
            _log.info("approve_tenant: seeded %d email templates for tenant %s", seeded, tenant.id)
        await queue_tenant_lifecycle_email(
            self.session, tenant=tenant, template_key="tenant_approved",
            subject=f"Your account '{tenant.name}' has been approved",
            body_html=f"<p><strong>{tenant.name}</strong> is now active on the platform.</p>",
        )
        await fan_out_platform_notification(
            self.session, event_type="tenant_approved",
            title=f"Tenant approved: {tenant.name}",
            body=f"{tenant.name} is now active.", tenant_id=tenant_id,
        )
        return tenant

    async def reject_tenant(
        self, tenant_id: UUID, actor_id: UUID, reason_note: str,
        ip_address: str | None = None, user_agent: str | None = None,
    ) -> Tenant:
        tenant = await self.get_tenant(tenant_id)
        if tenant.status != TenantStatus.PENDING_APPROVAL:
            raise bad_request(f"Cannot reject; current status: {tenant.status.value}")
        before = {"status": tenant.status.value}
        tenant.status = TenantStatus.SUSPENDED
        tenant.suspended_at = datetime.now(UTC).replace(tzinfo=None)
        tenant.suspended_reason = f"[REJECTED] {reason_note}"
        tenant.suspended_by_platform_user_id = actor_id
        await self.session.flush()
        await self._rls_and_audit(tenant_id, AuditAction.TENANT_REJECTED, actor_id, before, {"reason": reason_note}, ip_address, user_agent)
        await self.session.refresh(tenant)
        await queue_tenant_lifecycle_email(
            self.session, tenant=tenant, template_key="tenant_rejected",
            subject=f"Your application '{tenant.name}' was not approved",
            body_html=f"<p>Reason: {reason_note}</p><p>Contact support to appeal.</p>",
        )
        return tenant

    async def suspend_tenant(
        self, tenant_id: UUID, actor_id: UUID | None = None, reason_note: str = "",
        ip_address: str | None = None, user_agent: str | None = None,
    ) -> Tenant:
        tenant = await self.get_tenant(tenant_id)
        if tenant.status == TenantStatus.SUSPENDED:
            return tenant
        before = {"status": tenant.status.value}
        tenant.status = TenantStatus.SUSPENDED
        tenant.suspended_at = datetime.now(UTC).replace(tzinfo=None)
        tenant.suspended_reason = reason_note or None
        tenant.suspended_by_platform_user_id = actor_id
        await self.session.flush()
        await self._rls_and_audit(tenant_id, AuditAction.TENANT_SUSPENDED, actor_id, before, {"reason": reason_note}, ip_address, user_agent)
        await self.session.refresh(tenant)
        await fan_out_platform_notification(
            self.session, event_type="tenant_suspended",
            title=f"Tenant suspended: {tenant.name}",
            body=f"{tenant.name} suspended. Reason: {reason_note}", tenant_id=tenant_id,
        )
        return tenant

    async def reactivate_tenant(
        self, tenant_id: UUID, actor_id: UUID, reason_note: str | None = None,
        ip_address: str | None = None, user_agent: str | None = None,
    ) -> Tenant:
        tenant = await self.get_tenant(tenant_id)
        if tenant.status == TenantStatus.ACTIVE:
            return tenant
        before = {"status": tenant.status.value, "suspended_reason": tenant.suspended_reason}
        tenant.status = TenantStatus.ACTIVE
        tenant.suspended_at = None
        tenant.suspended_reason = None
        tenant.suspended_by_platform_user_id = None
        await self.session.flush()
        await self._rls_and_audit(tenant_id, AuditAction.TENANT_REACTIVATED, actor_id, before, {"note": reason_note}, ip_address, user_agent)
        await self.session.refresh(tenant)
        await fan_out_platform_notification(
            self.session, event_type="tenant_reactivated",
            title=f"Tenant reactivated: {tenant.name}",
            body=f"{tenant.name} is now active.", tenant_id=tenant_id,
        )
        return tenant

    async def get_my_tenant(self, tenant_id: UUID) -> Tenant:
        return await self.get_tenant(tenant_id)

    async def update_my_tenant(
        self, tenant_id: UUID, current_user: dict, *,
        name: str | None = None, currency: str | None = None,
        timezone_: str | None = None, locale: str | None = None,
        default_properties_view=None, operating_countries: list[str] | None = None,
        property_ref_prefix: str | None = None,
        banner_url: str | None = None,
        ip_address: str | None = None, user_agent: str | None = None,
    ) -> Tenant:
        role = current_user.get("role")
        allowed = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}
        if role not in allowed:
            raise forbidden("Only company_owner or company_admin can update tenant settings")
        tenant = await self.get_tenant(tenant_id)
        if property_ref_prefix is not None and property_ref_prefix != tenant.property_ref_prefix:
            from sqlalchemy import func as _func, select as _select
            clash = (await self.session.execute(
                _select(Tenant.id).where(
                    _func.upper(Tenant.property_ref_prefix) == property_ref_prefix,
                    Tenant.id != tenant_id,
                )
            )).first()
            if clash:
                raise bad_request(
                    f"property_ref_prefix '{property_ref_prefix}' is already in use"
                )
        before = {
            "name": tenant.name, "currency": tenant.currency, "timezone": tenant.timezone,
            "locale": tenant.locale, "default_properties_view": tenant.default_properties_view.value,
            "operating_countries": tenant.operating_countries,
            "property_ref_prefix": tenant.property_ref_prefix,
            "banner_url": tenant.banner_url,
        }
        if name is not None: tenant.name = name
        if currency is not None: tenant.currency = currency
        if timezone_ is not None: tenant.timezone = timezone_
        if locale is not None: tenant.locale = locale
        if default_properties_view is not None: tenant.default_properties_view = default_properties_view
        if operating_countries is not None: tenant.operating_countries = operating_countries
        if property_ref_prefix is not None: tenant.property_ref_prefix = property_ref_prefix
        if banner_url is not None: tenant.banner_url = banner_url
        await self.session.flush()
        after = {
            "name": tenant.name, "currency": tenant.currency, "timezone": tenant.timezone,
            "locale": tenant.locale, "default_properties_view": tenant.default_properties_view.value,
            "operating_countries": tenant.operating_countries,
            "property_ref_prefix": tenant.property_ref_prefix,
            "banner_url": tenant.banner_url,
        }
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))
        await self._audit.record(
            AuditAction.TENANT_UPDATED, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]), entity_type="tenant", entity_id=tenant_id,
            before=before, after=after, ip_address=ip_address, user_agent=user_agent,
        )
        await self.session.refresh(tenant)
        return tenant

    async def set_public_site_feature(
        self,
        tenant_id: UUID,
        actor_id: UUID,
        *,
        enabled: bool,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Toggle the platform master switch for a tenant's public site."""
        tenant = await self.get_tenant(tenant_id)
        before = {"public_site_feature_enabled": tenant.public_site_feature_enabled}
        tenant.public_site_feature_enabled = enabled
        await self.session.flush()
        after = {"public_site_feature_enabled": enabled}
        await self._rls_and_audit(
            tenant_id, AuditAction.TENANT_UPDATED, actor_id, before, after,
            ip_address, user_agent,
        )
        await self.session.refresh(tenant)
        return tenant

    async def update_media_limits(
        self,
        tenant_id: UUID,
        actor_id: UUID,
        *,
        max_images_per_property: int,
        max_videos_per_property: int,
        max_image_mb: int,
        max_video_mb: int,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Tenant:
        """Set per-tenant media caps (platform admin only, >= floor enforced by schema)."""
        tenant = await self.get_tenant(tenant_id)
        before = {
            "max_images_per_property": tenant.max_images_per_property,
            "max_videos_per_property": tenant.max_videos_per_property,
            "max_image_mb": tenant.max_image_mb,
            "max_video_mb": tenant.max_video_mb,
        }
        tenant.max_images_per_property = max_images_per_property
        tenant.max_videos_per_property = max_videos_per_property
        tenant.max_image_mb = max_image_mb
        tenant.max_video_mb = max_video_mb
        await self.session.flush()
        after = {
            "max_images_per_property": tenant.max_images_per_property,
            "max_videos_per_property": tenant.max_videos_per_property,
            "max_image_mb": tenant.max_image_mb,
            "max_video_mb": tenant.max_video_mb,
        }
        await self._rls_and_audit(
            tenant_id, AuditAction.OTHER, actor_id, before, after,
            ip_address, user_agent,
        )
        await self.session.refresh(tenant)
        return tenant

    async def _rls_and_audit(
        self, tenant_id: UUID, action: AuditAction, actor_id: UUID | None,
        before: dict, after: dict, ip_address: str | None, user_agent: str | None,
    ) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))
        await self._audit.record(
            action, tenant_id=tenant_id, actor_platform_user_id=actor_id,
            entity_type="tenant", entity_id=tenant_id,
            before=before, after=after, ip_address=ip_address, user_agent=user_agent,
        )
