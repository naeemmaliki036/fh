"""Tenants router — platform admin + tenant-self endpoints.

Route order matters: literal paths (/me) must be registered before
parameterised paths (/{tenant_id}) to prevent FastAPI matching 'me' as a UUID.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import (
    CurrentPlatformUser,
    CurrentUser,
    DbSession,
    ReqCtx,
    TenantContext,
)
from apps.api.models.enums import TenantStatus
from apps.api.schemas.tenant import TenantListResponse, TenantResponse, TenantUpdateRequest
from apps.api.services.tenant_service import TenantService

router = APIRouter()


def _svc(db: DbSession) -> TenantService:
    return TenantService(db)


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
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


# ------------------------------------------------------------------
# Platform-admin endpoints
# ------------------------------------------------------------------


@router.get("", response_model=TenantListResponse)
async def list_tenants(
    _: CurrentPlatformUser,
    status: TenantStatus | None = Query(None),
    svc: TenantService = Depends(_svc),
) -> TenantListResponse:
    """List all tenants (platform admin only)."""
    items, total = await svc.list_tenants(status=status)
    return TenantListResponse(items=items, total=total)  # type: ignore[arg-type]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: UUID,
    current_user: CurrentUser,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Get tenant by ID. Tenant users can only access their own."""
    token_tid = current_user.get("tenant_id")
    if token_tid and UUID(token_tid) != tenant_id:
        from packages.common.utils.error_handlers import forbidden
        raise forbidden("Cannot access another tenant's data")
    return await svc.get_tenant(tenant_id)  # type: ignore[return-value]


@router.post("/{tenant_id}/approve", response_model=TenantResponse)
async def approve_tenant(
    tenant_id: UUID,
    current_platform: CurrentPlatformUser,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Approve a pending tenant (platform admin only)."""
    return await svc.approve_tenant(  # type: ignore[return-value]
        tenant_id,
        UUID(current_platform["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


@router.post("/{tenant_id}/suspend", response_model=TenantResponse)
async def suspend_tenant(
    tenant_id: UUID,
    current_platform: CurrentPlatformUser,
    ctx: ReqCtx,
    svc: TenantService = Depends(_svc),
) -> TenantResponse:
    """Suspend an active tenant (platform admin only)."""
    return await svc.suspend_tenant(  # type: ignore[return-value]
        tenant_id,
        actor_id=UUID(current_platform["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
