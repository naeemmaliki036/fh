"""Tenant public-site settings router — authenticated, owner/admin only.

Registered under /tenants/me/public-site so literal paths are resolved
before the /{tenant_id} parameterised route in tenants.py.

RBAC is enforced in TenantPublicSiteService, not here.
"""

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.schemas.public_site import PublicSiteSettingsResponse, PublicSiteSettingsUpdate
from apps.api.services.tenant_public_site_service import TenantPublicSiteService

router = APIRouter()


def _svc(db: DbSession) -> TenantPublicSiteService:
    return TenantPublicSiteService(db)


# ---------------------------------------------------------------------------
# Endpoint 6 — GET /tenants/me/public-site
# ---------------------------------------------------------------------------


@router.get("", response_model=PublicSiteSettingsResponse)
async def get_public_site_settings(
    tenant_id: TenantContext,
    current_user: CurrentUser,
    svc: TenantPublicSiteService = Depends(_svc),
) -> PublicSiteSettingsResponse:
    """Return current public-site settings (company_owner / company_admin only)."""
    svc._require_admin(current_user["role"])
    data = await svc.get_settings(tenant_id)
    return PublicSiteSettingsResponse(**data)


# ---------------------------------------------------------------------------
# Endpoint 5 — PATCH /tenants/me/public-site
# ---------------------------------------------------------------------------


@router.patch("", response_model=PublicSiteSettingsResponse)
async def update_public_site_settings(
    body: PublicSiteSettingsUpdate,
    tenant_id: TenantContext,
    current_user: CurrentUser,
    ctx: ReqCtx,
    svc: TenantPublicSiteService = Depends(_svc),
) -> PublicSiteSettingsResponse:
    """Update public-site settings (company_owner / company_admin only).

    RBAC enforced at service layer — a 403 is raised for any other role.
    Audit log entry written with before/after of all changed fields.
    """
    updates = body.model_dump(exclude_unset=True)
    data = await svc.update_settings(
        tenant_id,
        current_user,
        updates,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return PublicSiteSettingsResponse(**data)
