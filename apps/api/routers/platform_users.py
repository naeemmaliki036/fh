"""Platform users router — super_admin only CRUD for platform operators.

No DELETE endpoint — blocked by DB trigger (migration 0016).
All endpoints require PlatformRole.SUPER_ADMIN via require_platform_role().
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from apps.api.dependencies import DbSession, ReqCtx
from apps.api.schemas.platform_user import (
    PlatformUserCreateRequest,
    PlatformUserListResponse,
    PlatformUserResetPasswordRequest,
    PlatformUserResponse,
    PlatformUserUpdateRequest,
)
from apps.api.security.platform_roles import SUPER_ONLY, require_platform_role
from apps.api.services.platform_user_service import PlatformUserService

router = APIRouter()

_SuperOnly = Annotated[dict, Depends(require_platform_role(*SUPER_ONLY))]


def _svc(db: DbSession) -> PlatformUserService:
    return PlatformUserService(db)


@router.get("", response_model=PlatformUserListResponse)
async def list_platform_users(
    _: _SuperOnly,
    svc: PlatformUserService = Depends(_svc),
) -> PlatformUserListResponse:
    """List all platform users (super_admin only)."""
    items = await svc.list_users()
    return PlatformUserListResponse(items=items, total=len(items))  # type: ignore[arg-type]


@router.post("", response_model=PlatformUserResponse, status_code=status.HTTP_201_CREATED)
async def create_platform_user(
    body: PlatformUserCreateRequest,
    actor: _SuperOnly,
    ctx: ReqCtx,
    svc: PlatformUserService = Depends(_svc),
) -> PlatformUserResponse:
    """Create a new platform user (super_admin only)."""
    pu = await svc.create_user(
        email=str(body.email),
        full_name=body.full_name,
        role=body.role,
        password=body.password,
        actor_id=UUID(actor["id"]),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return pu  # type: ignore[return-value]


@router.patch("/{user_id}", response_model=PlatformUserResponse)
async def update_platform_user(
    user_id: UUID,
    body: PlatformUserUpdateRequest,
    actor: _SuperOnly,
    ctx: ReqCtx,
    svc: PlatformUserService = Depends(_svc),
) -> PlatformUserResponse:
    """Partially update a platform user (super_admin only).

    Cannot change own role.
    """
    updates = body.model_dump(exclude_unset=True)
    pu = await svc.update_user(
        user_id,
        UUID(actor["id"]),
        full_name=updates.get("full_name"),
        role=updates.get("role"),
        status=updates.get("status"),
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return pu  # type: ignore[return-value]


@router.post("/{user_id}/reset-password", response_model=PlatformUserResponse)
async def reset_platform_user_password(
    user_id: UUID,
    body: PlatformUserResetPasswordRequest,
    actor: _SuperOnly,
    ctx: ReqCtx,
    svc: PlatformUserService = Depends(_svc),
) -> PlatformUserResponse:
    """Reset a platform user's password (super_admin only)."""
    pu = await svc.reset_password(
        user_id,
        UUID(actor["id"]),
        new_password=body.new_password,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return pu  # type: ignore[return-value]
