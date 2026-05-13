"""Leads router — Lead CRUD + stage + assignment + activity timeline."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import LeadStage
from apps.api.schemas.lead import (
    LeadAssignRequest,
    LeadCreateRequest,
    LeadListResponse,
    LeadResponse,
    LeadTransitionRequest,
    LeadUpdateRequest,
)
from apps.api.schemas.lead_activity import (
    LeadActivityCreateRequest,
    LeadActivityListResponse,
    LeadActivityResponse,
)
from apps.api.services.lead_activity_service import LeadActivityService
from apps.api.services.lead_service import LeadService

router = APIRouter()


def _svc(db: DbSession) -> LeadService:
    return LeadService(db)


def _act_svc(db: DbSession) -> LeadActivityService:
    return LeadActivityService(db)


def _lead_resp(data: dict) -> LeadResponse:
    lead = data["lead"]
    return LeadResponse.model_validate({
        **lead.__dict__,
        "customer": data.get("customer"),
        "interest_property": data.get("interest_property"),
        "interest_listing": data.get("interest_listing"),
    })


def _act_resp(row: dict) -> LeadActivityResponse:
    a = row["activity"]
    return LeadActivityResponse.model_validate(
        {**a.__dict__, "actor_full_name": row.get("actor_full_name")}
    )


# ------------------------------------------------------------------
# Lead CRUD
# ------------------------------------------------------------------

@router.get("", response_model=LeadListResponse)
async def list_leads(
    tenant_id: TenantContext,
    stage: LeadStage | None = Query(None),
    assigned_agent_id: UUID | None = Query(None),
    customer_id: UUID | None = Query(None),
    q: str | None = Query(None),
    next_action_from: datetime | None = Query(None),
    next_action_to: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: LeadService = Depends(_svc),
) -> LeadListResponse:
    items, total = await svc.list_leads(
        tenant_id, stage=stage, assigned_agent_id=assigned_agent_id,
        customer_id=customer_id, q=q,
        next_action_from=next_action_from, next_action_to=next_action_to,
        skip=skip, limit=limit,
    )
    return LeadListResponse(items=[_lead_resp(d) for d in items], total=total)


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: LeadService = Depends(_svc),
) -> LeadResponse:
    inline = body.customer.model_dump(exclude_none=True) if body.customer else None
    try:
        data = await svc.create_lead(
            tenant_id, current_user,
            customer_id=body.customer_id,
            inline_customer=inline,
            source=body.source,
            stage=body.stage,
            assigned_agent_id=body.assigned_agent_id,
            interest_property_id=body.interest_property_id,
            interest_listing_id=body.interest_listing_id,
            notes=body.notes,
            next_action_at=body.next_action_at,
        )
    except HTTPException as exc:
        if exc.status_code == status.HTTP_409_CONFLICT:
            raise  # surface the merge hint from customer_service
        raise
    return _lead_resp(data)


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    tenant_id: TenantContext,
    svc: LeadService = Depends(_svc),
) -> LeadResponse:
    return _lead_resp(await svc.get_lead(lead_id, tenant_id))


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    body: LeadUpdateRequest,
    tenant_id: TenantContext,
    svc: LeadService = Depends(_svc),
) -> LeadResponse:
    return _lead_resp(await svc.update_lead(lead_id, tenant_id, body.model_dump(exclude_unset=True)))


# ------------------------------------------------------------------
# Stage + assignment
# ------------------------------------------------------------------

@router.post("/{lead_id}/transition", response_model=LeadResponse)
async def transition_lead(
    lead_id: UUID,
    body: LeadTransitionRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: LeadService = Depends(_svc),
) -> LeadResponse:
    return _lead_resp(
        await svc.transition(lead_id, tenant_id, current_user, body.stage, body.description)
    )


@router.post("/{lead_id}/assign", response_model=LeadResponse)
async def assign_lead(
    lead_id: UUID,
    body: LeadAssignRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: LeadService = Depends(_svc),
) -> LeadResponse:
    return _lead_resp(await svc.assign(lead_id, tenant_id, current_user, body.agent_id))


# ------------------------------------------------------------------
# Activity timeline
# ------------------------------------------------------------------

@router.get("/{lead_id}/activities", response_model=LeadActivityListResponse)
async def list_activities(
    lead_id: UUID,
    tenant_id: TenantContext,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: LeadActivityService = Depends(_act_svc),
) -> LeadActivityListResponse:
    rows, total = await svc.list_activities(lead_id, tenant_id, skip=skip, limit=limit)
    return LeadActivityListResponse(items=[_act_resp(r) for r in rows], total=total)


@router.post("/{lead_id}/activities", response_model=LeadActivityResponse, status_code=201)
async def create_activity(
    lead_id: UUID,
    body: LeadActivityCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: LeadActivityService = Depends(_act_svc),
) -> LeadActivityResponse:
    activity = await svc.create_manual(
        lead_id, tenant_id, current_user,
        body.kind, body.description, body.activity_metadata,
    )
    return LeadActivityResponse.model_validate({**activity.__dict__, "actor_full_name": None})


@router.delete("/{lead_id}/activities/{activity_id}", status_code=204)
async def delete_activity(
    lead_id: UUID,
    activity_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: LeadActivityService = Depends(_act_svc),
) -> None:
    await svc.delete_activity(activity_id, lead_id, tenant_id, current_user)
