"""Off-market reasons router."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.schemas.off_market_reason import (
    OffMarketReasonCreate,
    OffMarketReasonResponse,
    OffMarketReasonUpdate,
)
from apps.api.services.off_market_reason_service import OffMarketReasonService

router = APIRouter()


def _svc(db: DbSession) -> OffMarketReasonService:
    return OffMarketReasonService(db)


@router.get("", response_model=list[OffMarketReasonResponse])
async def list_off_market_reasons(
    tenant_id: TenantContext,
    svc: OffMarketReasonService = Depends(_svc),
) -> list[OffMarketReasonResponse]:
    reasons = await svc.list_reasons(tenant_id)
    return [OffMarketReasonResponse.model_validate(r) for r in reasons]


@router.post("", response_model=OffMarketReasonResponse, status_code=201)
async def create_off_market_reason(
    body: OffMarketReasonCreate,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: OffMarketReasonService = Depends(_svc),
) -> OffMarketReasonResponse:
    reason = await svc.create_reason(
        tenant_id, current_user,
        code=body.code,
        label=body.label,
        requires_note=body.requires_note,
        ordering=body.ordering,
    )
    return OffMarketReasonResponse.model_validate(reason)


@router.patch("/{reason_id}", response_model=OffMarketReasonResponse)
async def update_off_market_reason(
    reason_id: UUID,
    body: OffMarketReasonUpdate,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: OffMarketReasonService = Depends(_svc),
) -> OffMarketReasonResponse:
    reason = await svc.update_reason(
        reason_id, tenant_id, current_user, body.model_dump(exclude_unset=True)
    )
    return OffMarketReasonResponse.model_validate(reason)


@router.delete("/{reason_id}", status_code=204)
async def delete_off_market_reason(
    reason_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: OffMarketReasonService = Depends(_svc),
) -> None:
    await svc.delete_reason(reason_id, tenant_id, current_user)
