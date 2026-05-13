"""EmailOutbox router — admin read + retry + manual process endpoint.

Mounted at /admin/email-outbox in main.py.

RBAC:
  Platform super_admin / ops / support: full access to all tenants.
  Tenant company_owner / company_admin: own-tenant rows only.
  POST /process: super_admin only.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import AnyAuthUser, DbSession
from apps.api.models.enums import PlatformRole, TenantRole
from apps.api.schemas.email_outbox import (
    EmailOutboxListResponse,
    EmailOutboxResponse,
    ProcessOutboxResponse,
)
from apps.api.services.email_outbox_service import EmailOutboxService
from packages.common.utils.error_handlers import forbidden

router = APIRouter()

_PLATFORM_READ_ROLES = {
    PlatformRole.SUPER_ADMIN,
    PlatformRole.OPERATIONS_ADMIN,
    PlatformRole.SUPPORT_ADMIN,
}
_TENANT_READ_ROLES = {TenantRole.COMPANY_OWNER, TenantRole.COMPANY_ADMIN}


def _svc(db: DbSession) -> EmailOutboxService:
    return EmailOutboxService(db)


def _caller_tenant_id(current_user: dict) -> uuid.UUID | None:
    """Return caller's tenant_id UUID or None if platform user."""
    tid = current_user.get("tenant_id")
    return uuid.UUID(tid) if tid else None


def _assert_platform_read(current_user: dict) -> None:
    role = current_user.get("role")
    if role not in {r.value for r in _PLATFORM_READ_ROLES}:
        raise forbidden("Insufficient platform role for email outbox access")


def _assert_tenant_read(current_user: dict) -> None:
    role = current_user.get("role")
    if role not in {r.value for r in _TENANT_READ_ROLES}:
        raise forbidden("company_owner or company_admin role required")


# ------------------------------------------------------------------
# List
# ------------------------------------------------------------------


@router.get("", response_model=EmailOutboxListResponse)
async def list_outbox(
    current_user: AnyAuthUser,
    status: str | None = Query(None),
    tenant_id: uuid.UUID | None = Query(None),
    from_dt: datetime | None = Query(None, alias="from"),
    to_dt: datetime | None = Query(None, alias="to"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    svc: EmailOutboxService = Depends(_svc),
) -> EmailOutboxListResponse:
    caller_tid = _caller_tenant_id(current_user)
    if caller_tid is None:
        _assert_platform_read(current_user)
    else:
        _assert_tenant_read(current_user)

    items, total = await svc.list_outbox(
        status=status,
        tenant_id=tenant_id,
        from_dt=from_dt,
        to_dt=to_dt,
        limit=limit,
        skip=skip,
        caller_tenant_id=caller_tid,
    )
    return EmailOutboxListResponse(
        items=[EmailOutboxResponse.model_validate(r) for r in items],
        total=total,
    )


# ------------------------------------------------------------------
# Get single
# ------------------------------------------------------------------


@router.get("/{outbox_id}", response_model=EmailOutboxResponse)
async def get_outbox_item(
    outbox_id: uuid.UUID,
    current_user: AnyAuthUser,
    svc: EmailOutboxService = Depends(_svc),
) -> EmailOutboxResponse:
    caller_tid = _caller_tenant_id(current_user)
    if caller_tid is None:
        _assert_platform_read(current_user)
    else:
        _assert_tenant_read(current_user)

    row = await svc.get_outbox_item(outbox_id, caller_tenant_id=caller_tid)
    return EmailOutboxResponse.model_validate(row)


# ------------------------------------------------------------------
# Process — literal route registered BEFORE /{outbox_id}/retry
# to prevent FastAPI treating "process" as a UUID path param.
# ------------------------------------------------------------------


@router.post("/process", response_model=ProcessOutboxResponse)
async def process_outbox(
    current_user: AnyAuthUser,
    limit: int = Query(20, ge=1, le=100),
    svc: EmailOutboxService = Depends(_svc),
) -> ProcessOutboxResponse:
    """Manually trigger send_pending. super_admin only. Useful for testing."""
    role = current_user.get("role")
    is_platform = current_user.get("is_platform", False)
    if not is_platform or role != PlatformRole.SUPER_ADMIN.value:
        raise forbidden("super_admin role required")

    result = await svc.send_pending(limit=limit)
    return ProcessOutboxResponse(**result)


# ------------------------------------------------------------------
# Retry
# ------------------------------------------------------------------


@router.post("/{outbox_id}/retry", response_model=EmailOutboxResponse)
async def retry_outbox_item(
    outbox_id: uuid.UUID,
    current_user: AnyAuthUser,
    svc: EmailOutboxService = Depends(_svc),
) -> EmailOutboxResponse:
    caller_tid = _caller_tenant_id(current_user)
    if caller_tid is None:
        _assert_platform_read(current_user)
    else:
        _assert_tenant_read(current_user)

    row = await svc.retry(outbox_id=outbox_id)
    return EmailOutboxResponse.model_validate(row)
