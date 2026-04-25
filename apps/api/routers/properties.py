"""Properties router — Property CRUD + Property↔Agent assignments."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.models.enums import PropertyStatus, PropertyType
from apps.api.schemas.property import (
    PropertyAgentAssignRequest,
    PropertyAgentPatchRequest,
    PropertyAgentResponse,
    PropertyCreateRequest,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdateRequest,
)
from apps.api.services.property_agent_service import PropertyAgentService
from apps.api.services.property_service import PropertyService

router = APIRouter()


def _prop_svc(db: DbSession) -> PropertyService:
    return PropertyService(db)


def _agent_svc(db: DbSession) -> PropertyAgentService:
    return PropertyAgentService(db)


def _to_response(data: dict) -> PropertyResponse:
    prop = data["property"]
    return PropertyResponse.model_validate({
        **prop.__dict__,
        "assigned_agents": data["assigned_agents"],
        "media_count": data["media_count"],
        "listing_count": data["listing_count"],
    })


# ------------------------------------------------------------------
# Property CRUD
# ------------------------------------------------------------------

@router.get("", response_model=PropertyListResponse)
async def list_properties(
    tenant_id: TenantContext,
    status: PropertyStatus | None = Query(None),
    property_type: PropertyType | None = Query(None),
    city: str | None = Query(None),
    area: str | None = Query(None),
    q: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: PropertyService = Depends(_prop_svc),
) -> PropertyListResponse:
    items, total = await svc.list_properties(
        tenant_id, status=status, property_type=property_type,
        city=city, area=area, q=q, skip=skip, limit=limit,
    )
    return PropertyListResponse(items=[_to_response(d) for d in items], total=total)


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(
    body: PropertyCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyService = Depends(_prop_svc),
) -> PropertyResponse:
    agent_ids = body.agent_ids or []
    fields = body.model_dump(exclude={"agent_ids"}, exclude_unset=False)
    data = await svc.create_property(tenant_id, current_user, agent_ids, **fields)
    return _to_response(data)


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: UUID,
    tenant_id: TenantContext,
    svc: PropertyService = Depends(_prop_svc),
) -> PropertyResponse:
    return _to_response(await svc.get_property(property_id, tenant_id))


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: UUID,
    body: PropertyUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyService = Depends(_prop_svc),
) -> PropertyResponse:
    updates = body.model_dump(exclude_unset=True)
    return _to_response(await svc.update_property(property_id, tenant_id, current_user, updates))


@router.delete("/{property_id}", status_code=204)
async def deactivate_property(
    property_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyService = Depends(_prop_svc),
) -> None:
    await svc.deactivate_property(property_id, tenant_id, current_user)


# ------------------------------------------------------------------
# Property↔Agent assignments
# ------------------------------------------------------------------

@router.post("/{property_id}/agents", response_model=PropertyAgentResponse, status_code=201)
async def add_agent(
    property_id: UUID,
    body: PropertyAgentAssignRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyAgentService = Depends(_agent_svc),
) -> PropertyAgentResponse:
    pa = await svc.add_agent(
        property_id, body.agent_id, tenant_id, current_user, is_primary=body.is_primary
    )
    return PropertyAgentResponse.model_validate(pa)


@router.patch("/{property_id}/agents/{agent_id}", response_model=PropertyAgentResponse)
async def update_agent_assignment(
    property_id: UUID,
    agent_id: UUID,
    body: PropertyAgentPatchRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyAgentService = Depends(_agent_svc),
) -> PropertyAgentResponse:
    pa = await svc.update_agent(
        property_id, agent_id, tenant_id, current_user, is_primary=body.is_primary
    )
    return PropertyAgentResponse.model_validate(pa)


@router.delete("/{property_id}/agents/{agent_id}", status_code=204)
async def remove_agent(
    property_id: UUID,
    agent_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyAgentService = Depends(_agent_svc),
) -> None:
    await svc.remove_agent(property_id, agent_id, tenant_id, current_user)
