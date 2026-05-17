"""Tenant commission rates router.

Mounted at /tenant/commission-rates.
All endpoints require an authenticated tenant user.
Write endpoints (PATCH, audit GET) are restricted to company_owner,
company_admin, or finance_user roles.
"""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import CommissionRateTransactionType, TenantRole
from apps.api.schemas.tenant_commission_rate import (
    TenantCommissionRateAuditEntry,
    TenantCommissionRateListResponse,
    TenantCommissionRateResponse,
    TenantCommissionRateUpdateRequest,
)
from apps.api.services.tenant_commission_rate_service import (
    TenantCommissionRateService,
)
from packages.common.utils.error_handlers import forbidden

router = APIRouter()

_WRITE_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.FINANCE_USER.value,
}


def _require_write(user: dict) -> None:
    if user.get("role") not in _WRITE_ROLES:
        raise forbidden("company_owner, company_admin, or finance_user required")


def _svc(db: DbSession) -> TenantCommissionRateService:
    return TenantCommissionRateService(db)


@router.get("", response_model=TenantCommissionRateListResponse)
async def list_commission_rates(
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: TenantCommissionRateService = Depends(_svc),
) -> TenantCommissionRateListResponse:
    """Return all 4 commission rate rows for the current tenant."""
    data = await svc.list_rates(tenant_id)
    return TenantCommissionRateListResponse(
        items=[TenantCommissionRateResponse.model_validate(item) for item in data["items"]]
    )


@router.patch("/{transaction_type}", response_model=TenantCommissionRateResponse)
async def update_commission_rate(
    transaction_type: CommissionRateTransactionType,
    body: TenantCommissionRateUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: TenantCommissionRateService = Depends(_svc),
) -> TenantCommissionRateResponse:
    """Upsert the commission rate for a specific transaction type.

    Only company_owner, company_admin, or finance_user may call this.
    """
    _require_write(current_user)
    result = await svc.update_rate(
        tenant_id=tenant_id,
        transaction_type=transaction_type,
        rate=body.rate,
        notes=body.notes,
        current_user_id=UUID(current_user["id"]),
        role=current_user["role"],
    )
    return TenantCommissionRateResponse.model_validate(result)


@router.get(
    "/{transaction_type}/audit",
    response_model=list[TenantCommissionRateAuditEntry],
)
async def get_rate_audit_log(
    transaction_type: CommissionRateTransactionType,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    limit: int = 50,
    svc: TenantCommissionRateService = Depends(_svc),
) -> list[TenantCommissionRateAuditEntry]:
    """Return the audit history for a specific commission rate type.

    Only company_owner, company_admin, or finance_user may call this.
    """
    _require_write(current_user)
    entries = await svc.get_audit_log(tenant_id, transaction_type, limit=limit)
    return [TenantCommissionRateAuditEntry.model_validate(e) for e in entries]
