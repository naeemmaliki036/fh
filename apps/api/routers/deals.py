"""Deals router — CRUD + stage transitions + commission."""

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import DealStage, DealType
from apps.api.schemas.deal import (
    AgentSummary,
    CustomerSummary,
    DealCommissionOverrideRequest,
    DealCommissionPayoutCancelRequest,
    DealCommissionPayoutRequest,
    DealCreateRequest,
    DealListResponse,
    DealResponse,
    DealTransitionRequest,
    DealUpdateRequest,
    PropertySummary,
)
from apps.api.services.deal_commission_service import DealCommissionService
from apps.api.services.deal_service import DealService
from apps.api.utils.commission import compute_commission_amount

router = APIRouter()


def _svc(db: DbSession) -> DealService:
    return DealService(db)


def _com_svc(db: DbSession) -> DealCommissionService:
    return DealCommissionService(db)


def _to_response(data: dict) -> DealResponse:
    deal = data["deal"]
    commission_amount = data.get("commission_amount") or compute_commission_amount(
        deal.commission_type,
        Decimal(str(deal.commission_value)),
        Decimal(str(deal.transaction_value)),
    )
    customer = data.get("customer")
    agent = data.get("primary_agent")
    prop = data.get("interest_property")
    return DealResponse.model_validate({
        **deal.__dict__,
        "commission_amount": commission_amount,
        "customer": CustomerSummary.model_validate(customer) if customer else None,
        "primary_agent": AgentSummary.model_validate(agent) if agent else None,
        "interest_property": PropertySummary.model_validate(prop) if prop else None,
    })


def _deal_from_deal(deal, commission_amount: Decimal) -> DealResponse:
    return DealResponse.model_validate({**deal.__dict__, "commission_amount": commission_amount})


# ------------------------------------------------------------------
# CRUD
# ------------------------------------------------------------------

@router.get("", response_model=DealListResponse)
async def list_deals(
    tenant_id: TenantContext,
    stage: DealStage | None = Query(None),
    deal_type: DealType | None = Query(None),
    primary_agent_id: UUID | None = Query(None),
    customer_id: UUID | None = Query(None),
    q: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: DealService = Depends(_svc),
) -> DealListResponse:
    items, total = await svc.list_deals(
        tenant_id, stage=stage, deal_type=deal_type,
        primary_agent_id=primary_agent_id, customer_id=customer_id,
        q=q, skip=skip, limit=limit,
    )
    return DealListResponse(items=[_to_response(d) for d in items], total=total)


@router.post("", response_model=DealResponse, status_code=201)
async def create_deal(
    body: DealCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DealService = Depends(_svc),
) -> DealResponse:
    fields = body.model_dump()
    data = await svc.create_deal(tenant_id, current_user, **fields)
    return _to_response(data)


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: UUID,
    tenant_id: TenantContext,
    svc: DealService = Depends(_svc),
) -> DealResponse:
    return _to_response(await svc.get_deal(deal_id, tenant_id))


@router.patch("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: UUID,
    body: DealUpdateRequest,
    tenant_id: TenantContext,
    svc: DealService = Depends(_svc),
) -> DealResponse:
    return _to_response(await svc.update_deal(deal_id, tenant_id, body.model_dump(exclude_unset=True)))


# ------------------------------------------------------------------
# Stage
# ------------------------------------------------------------------

@router.post("/{deal_id}/transition", response_model=DealResponse)
async def transition_deal(
    deal_id: UUID,
    body: DealTransitionRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DealService = Depends(_svc),
) -> DealResponse:
    return _to_response(
        await svc.transition(deal_id, tenant_id, current_user, body.stage, body.description)
    )


# ------------------------------------------------------------------
# Commission
# ------------------------------------------------------------------

@router.post("/{deal_id}/commission", response_model=DealResponse)
async def override_commission(
    deal_id: UUID,
    body: DealCommissionOverrideRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DealCommissionService = Depends(_com_svc),
) -> DealResponse:
    deal = await svc.override_commission(
        deal_id, tenant_id, current_user,
        body.commission_type, body.commission_value, body.override_reason,
    )
    commission_amount = compute_commission_amount(
        deal.commission_type, Decimal(str(deal.commission_value)), Decimal(str(deal.transaction_value))
    )
    return _deal_from_deal(deal, commission_amount)


@router.post("/{deal_id}/commission/payout", response_model=DealResponse)
async def record_payout(
    deal_id: UUID,
    body: DealCommissionPayoutRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DealCommissionService = Depends(_com_svc),
) -> DealResponse:
    deal = await svc.record_payout(deal_id, tenant_id, current_user, body.amount, body.paid_at)
    commission_amount = compute_commission_amount(
        deal.commission_type, Decimal(str(deal.commission_value)), Decimal(str(deal.transaction_value))
    )
    return _deal_from_deal(deal, commission_amount)


@router.post("/{deal_id}/commission/payout/cancel", response_model=DealResponse)
async def cancel_payout(
    deal_id: UUID,
    body: DealCommissionPayoutCancelRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: DealCommissionService = Depends(_com_svc),
) -> DealResponse:
    deal = await svc.cancel_payout(deal_id, tenant_id, current_user, reason_note=body.reason_note)
    commission_amount = compute_commission_amount(
        deal.commission_type, Decimal(str(deal.commission_value)), Decimal(str(deal.transaction_value))
    )
    return _deal_from_deal(deal, commission_amount)
