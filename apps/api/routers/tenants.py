"""Tenants router — platform admin + tenant-self endpoints.

Route order matters: literal paths (/me) must be registered before
parameterised paths (/{tenant_id}) to prevent FastAPI matching 'me' as a UUID.

RBAC is enforced per-endpoint via require_platform_role().
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import (
    CurrentUser,
    DbSession,
    ReqCtx,
    TenantContext,
)
from apps.api.models.enums import PlatformRole, TenantStatus
from apps.api.schemas.tenant import (
    TenantApproveRequest,
    TenantDetailResponse,
    TenantListResponse,
    TenantMediaLimitsRequest,
    TenantReactivateRequest,
    TenantRejectRequest,
    TenantResponse,
    TenantSuspendRequest,
    TenantUpdateRequest,
)
from apps.api.security.platform_roles import (
    ALL_PLATFORM_ROLES,
    OPS_AND_ABOVE,
    require_platform_role,
)
from apps.api.services.tenant_detail_service import TenantDetailService
from apps.api.services.tenant_service import TenantService

router = APIRouter()


def _svc(db: DbSession) -> TenantService:
    return TenantService(db)


def _detail_svc(db: DbSession) -> TenantDetailService:
    return TenantDetailService(db)


# Annotated shortcut types for RBAC deps
_AllPlatformRoles = Annotated[dict, Depends(require_platform_role(*ALL_PLATFORM_ROLES))]
_OpsAndAbove = Annotated[dict, Depends(require_platform_role(*OPS_AND_ABOVE))]
_SuperOnly = Annotated[dict, Depends(require_platform_role(PlatformRole.SUPER_ADMIN))]


# ------------------------------------------------------------------
# Tenant-self endpoints — MUST be registered before /{tenant_id}
# ------------------------------------------------------------------


@router.get("/me", response_model=TenantResponse)
async def get_my_tenant(
    tenant_id: TenantContext,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Return current user's tenant info."""
    return await svc.get_my_tenant(tenant_id)  # type: ignore[return-value]


@router.patch("/me", response_model=TenantResponse)
async def update_my_tenant(
    body: TenantUpdateRequest,
    tenant_id: TenantContext,
    current_user: CurrentUser,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Update current tenant settings (company_owner/admin only)."""
    updates = body.model_dump(exclude_unset=True)
    return await svc.update_my_tenant(  # type: ignore[return-value]
        tenant_id,
        current_user,
        name=updates.get("name"),
        currency=updates.get("currency"),
        timezone_=updates.get("timezone"),
        locale=updates.get("locale"),
        default_properties_view=updates.get("default_properties_view"),
        operating_countries=updates.get("operating_countries"),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


# ------------------------------------------------------------------
# Platform-admin list + detail
# ------------------------------------------------------------------


@router.get("", response_model=TenantListResponse)
async def list_tenants(
    _platform_user: _AllPlatformRoles,
    status: TenantStatus | None = Query(None),
    svc: TenantService = Depends(_svc),
) -> TenantListResponse:
    """List all tenants (all platform roles)."""
    items, total = await svc.list_tenants(status=status)
    return TenantListResponse(items=items, total=total)  # type: ignore[arg-type]


@router.get("/{tenant_id}", response_model=TenantDetailResponse)
async def get_tenant_detail(
    tenant_id: UUID,
    _platform_user: _AllPlatformRoles,
    svc: TenantDetailService = Depends(_detail_svc),
) -> TenantDetailResponse:
    """Rich tenant detail for admin portal (all platform roles)."""
    detail = await svc.get_detail(tenant_id)
    return TenantDetailResponse(
        tenant=detail["tenant"],  # type: ignore[arg-type]
        counts=detail["counts"],  # type: ignore[arg-type]
        recent_activity=detail["recent_activity"],  # type: ignore[arg-type]
        subscription_info=detail["subscription_info"],  # type: ignore[arg-type]
    )


# ------------------------------------------------------------------
# Lifecycle actions — super/operations only
# ------------------------------------------------------------------


@router.post("/{tenant_id}/approve", response_model=TenantResponse)
async def approve_tenant(
    tenant_id: UUID,
    _body: TenantApproveRequest,
    platform_user: _OpsAndAbove,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Approve a pending tenant (super/operations admin)."""
    return await svc.approve_tenant(  # type: ignore[return-value]
        tenant_id,
        UUID(platform_user["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


@router.post("/{tenant_id}/reject", response_model=TenantResponse)
async def reject_tenant(
    tenant_id: UUID,
    body: TenantRejectRequest,
    platform_user: _OpsAndAbove,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Reject a pending_approval tenant (super/operations admin)."""
    return await svc.reject_tenant(  # type: ignore[return-value]
        tenant_id,
        UUID(platform_user["id"]),
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


@router.post("/{tenant_id}/suspend", response_model=TenantResponse)
async def suspend_tenant(
    tenant_id: UUID,
    body: TenantSuspendRequest,
    platform_user: _OpsAndAbove,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Suspend an active tenant (super/operations admin)."""
    return await svc.suspend_tenant(  # type: ignore[return-value]
        tenant_id,
        actor_id=UUID(platform_user["id"]),
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


@router.post("/{tenant_id}/reactivate", response_model=TenantResponse)
async def reactivate_tenant(
    tenant_id: UUID,
    body: TenantReactivateRequest,
    platform_user: _OpsAndAbove,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Reactivate a suspended tenant (super/operations admin)."""
    return await svc.reactivate_tenant(  # type: ignore[return-value]
        tenant_id,
        UUID(platform_user["id"]),
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


@router.post("/{tenant_id}/media-limits", response_model=TenantResponse)
async def set_tenant_media_limits(
    tenant_id: UUID,
    body: TenantMediaLimitsRequest,
    platform_user: _OpsAndAbove,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Override per-tenant media upload caps (super/operations admin only).

    All values must be >= their respective floor; the schema enforces this at
    422 level. An audit log entry is written with before/after diff.
    """
    return await svc.update_media_limits(  # type: ignore[return-value]
        tenant_id,
        UUID(platform_user["id"]),
        max_images_per_property=body.max_images_per_property,
        max_videos_per_property=body.max_videos_per_property,
        max_image_mb=body.max_image_mb,
        max_video_mb=body.max_video_mb,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
