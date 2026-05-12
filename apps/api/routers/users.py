"""Users router — tenant-scoped user management."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import (
    CurrentUser,
    DbSession,
    ReqCtx,
    TenantContext,
)
from apps.api.schemas.status_change import UserStatusChangeRequest
from apps.api.schemas.user import (
    UserCreateRequest,
    UserListResponse,
    UserMeUpdateRequest,
    UserResponse,
    UserUpdateRequest,
)
from apps.api.services.user_service import UserService

router = APIRouter()


def _svc(db: DbSession) -> UserService:
    return UserService(db)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: UserService = Depends(_svc),
) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return await svc.get_me(UUID(current_user["id"]), tenant_id)  # type: ignore[return-value]


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserMeUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: UserService = Depends(_svc),
) -> UserResponse:
    """Update own profile (full_name, phone only)."""
    updates = body.model_dump(exclude_unset=True)
    return await svc.update_me(UUID(current_user["id"]), tenant_id, updates)  # type: ignore[return-value]


@router.get("", response_model=UserListResponse)
async def list_users(
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: UserService = Depends(_svc),
) -> UserListResponse:
    """List all active users in the current tenant (admin only)."""
    items, total = await svc.list_users(tenant_id, current_user)
    return UserListResponse(items=items, total=total)  # type: ignore[arg-type]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: UserService = Depends(_svc),
) -> UserResponse:
    """Create a new user in the current tenant (admin only)."""
    return await svc.create_user(  # type: ignore[return-value]
        tenant_id,
        current_user,
        email=str(body.email),
        password=body.password,
        full_name=body.full_name,
        role=body.role,
        phone=body.phone,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: UserService = Depends(_svc),
) -> UserResponse:
    """Get a single user within the current tenant."""
    return await svc.get_user(user_id, tenant_id)  # type: ignore[return-value]


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: UserService = Depends(_svc),
) -> UserResponse:
    """Update a user (admin only). Cannot self-edit via this endpoint."""
    updates = body.model_dump(exclude_unset=True)
    return await svc.update_user(  # type: ignore[return-value]
        user_id, tenant_id, current_user, updates,
        ip_address=ctx.ip_address, user_agent=ctx.user_agent,
    )


@router.delete("/{user_id}", status_code=204)
async def disable_user(
    user_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: UserService = Depends(_svc),
) -> None:
    """Soft-delete (disable) a user (company_owner only)."""
    await svc.disable_user(
        user_id, tenant_id, current_user,
        ip_address=ctx.ip_address, user_agent=ctx.user_agent,
    )


@router.patch("/{user_id}/status", response_model=UserResponse)
async def change_user_status(
    user_id: UUID,
    body: UserStatusChangeRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: UserService = Depends(_svc),
) -> UserResponse:
    """Enable or disable a user (company_owner or company_admin only)."""
    return await svc.change_status(  # type: ignore[return-value]
        user_id, tenant_id, current_user,
        new_status=body.status,
        reason_code=body.reason_code,
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
