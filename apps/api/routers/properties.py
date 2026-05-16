"""Properties router — Property CRUD + Property↔Agent assignments."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.models.enums import (
    CompletionStatus,
    FitOutStatus,
    FurnishingStatus,
    OwnershipType,
    PropertyStatus,
    PropertyType,
    ViewOrientation,
)
from apps.api.services.amenity_catalog import AMENITY_CATALOG, AmenityCategory
from apps.api.schemas.property import (
    CommissionOverrideRequest,
    PropertyAgentAssignRequest,
    PropertyAgentPatchRequest,
    PropertyAgentResponse,
    PropertyCreateRequest,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdateRequest,
)
from apps.api.schemas.status_change import PropertyStatusChangeRequest
from apps.api.services.property_agent_service import PropertyAgentService
from apps.api.services.property_service import PropertyService
from apps.api.services.property_status_service import PropertyStatusService

router = APIRouter()


# ------------------------------------------------------------------
# Amenity catalog — no auth, static reference data
# ------------------------------------------------------------------

@router.get("/amenity-catalog", response_model=list[AmenityCategory], tags=["properties"])
async def get_amenity_catalog() -> list[AmenityCategory]:
    """Return the full amenity catalog (static reference data, no auth required)."""
    return AMENITY_CATALOG


def _prop_svc(db: DbSession) -> PropertyService:
    return PropertyService(db)


def _agent_svc(db: DbSession) -> PropertyAgentService:
    return PropertyAgentService(db)


def _status_svc(db: DbSession) -> PropertyStatusService:
    return PropertyStatusService(db)


def _to_response(data: dict) -> PropertyResponse:
    prop = data["property"]
    return PropertyResponse.model_validate({
        **prop.__dict__,
        "assigned_agents": data["assigned_agents"],
        "media_count": data["media_count"],
        "listing_count": data["listing_count"],
        "thumbnail_url": data.get("thumbnail_url"),
        "thumbnail_kind": data.get("thumbnail_kind"),
        "first_active_listing_id": data.get("first_active_listing_id"),
        "first_active_listing_title": data.get("first_active_listing_title"),
    })


# ------------------------------------------------------------------
# Property CRUD
# ------------------------------------------------------------------

@router.get("", response_model=PropertyListResponse)
async def list_properties(
    tenant_id: TenantContext,
    status: PropertyStatus | None = Query(None),
    property_type: PropertyType | None = Query(None),
    country: str | None = Query(None),
    city: str | None = Query(None),
    area: str | None = Query(None),
    assigned_agent_id: UUID | None = Query(None),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    currency: str | None = Query(None, max_length=8),
    min_bedrooms: int | None = Query(None, ge=0),
    max_bedrooms: int | None = Query(None, ge=0),
    min_bathrooms: int | None = Query(None, ge=0),
    max_bathrooms: int | None = Query(None, ge=0),
    min_size_sqft: float | None = Query(None, ge=0),
    max_size_sqft: float | None = Query(None, ge=0),
    tags: str | None = Query(None, description="CSV of tags; row must have ALL"),
    created_from: date | None = Query(None),
    created_to: date | None = Query(None),
    has_listing: bool | None = Query(None),
    q: str | None = Query(None),
    # --- migration 0039 attribute filters ---
    amenities: str | None = Query(None, description="CSV of amenity keys; row must include ALL"),
    furnishing_status: FurnishingStatus | None = Query(None),
    completion_status: CompletionStatus | None = Query(None),
    ownership_type: OwnershipType | None = Query(None),
    view_orientation: ViewOrientation | None = Query(None),
    fit_out_status: FitOutStatus | None = Query(None),
    min_service_charge_aed_sqft: float | None = Query(None, ge=0),
    max_service_charge_aed_sqft: float | None = Query(None, ge=0),
    min_plot_area_sqft: int | None = Query(None, ge=0),
    max_plot_area_sqft: int | None = Query(None, ge=0),
    min_parking_spaces: int | None = Query(None, ge=0),
    has_payment_plan: bool | None = Query(None),
    handover_year: int | None = Query(None),
    # migration 0040 filters
    min_build_year: int | None = Query(None),
    max_build_year: int | None = Query(None),
    listing_verified: bool | None = Query(None, description="Has at least one verified active listing"),
    has_floor_plan: bool | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|updated_at|price|title)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: PropertyService = Depends(_prop_svc),
) -> PropertyListResponse:
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    amenity_list = [a.strip() for a in amenities.split(",") if a.strip()] if amenities else None
    items, total = await svc.list_properties(
        tenant_id,
        status=status,
        property_type=property_type,
        country=country,
        city=city,
        area=area,
        assigned_agent_id=assigned_agent_id,
        min_price=min_price,
        max_price=max_price,
        currency=currency,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        min_bathrooms=min_bathrooms,
        max_bathrooms=max_bathrooms,
        min_size_sqft=min_size_sqft,
        max_size_sqft=max_size_sqft,
        tags=tag_list,
        created_from=created_from,
        created_to=created_to,
        has_listing=has_listing,
        q=q,
        amenities=amenity_list,
        furnishing_status=furnishing_status.value if furnishing_status else None,
        completion_status=completion_status.value if completion_status else None,
        ownership_type=ownership_type.value if ownership_type else None,
        view_orientation=view_orientation.value if view_orientation else None,
        fit_out_status=fit_out_status.value if fit_out_status else None,
        min_service_charge_aed_sqft=min_service_charge_aed_sqft,
        max_service_charge_aed_sqft=max_service_charge_aed_sqft,
        min_plot_area_sqft=min_plot_area_sqft,
        max_plot_area_sqft=max_plot_area_sqft,
        min_parking_spaces=min_parking_spaces,
        has_payment_plan=has_payment_plan,
        handover_year=handover_year,
        min_build_year=min_build_year,
        max_build_year=max_build_year,
        listing_verified=listing_verified,
        has_floor_plan=has_floor_plan,
        sort_by=sort_by,
        sort_dir=sort_dir,
        skip=skip,
        limit=limit,
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


@router.patch("/{property_id}/status", response_model=PropertyResponse)
async def change_property_status(
    property_id: UUID,
    body: PropertyStatusChangeRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: PropertyStatusService = Depends(_status_svc),
) -> PropertyResponse:
    return _to_response(
        await svc.change_status(
            property_id, tenant_id, current_user,
            new_status=body.status,
            reason_code=body.reason_code,
            reason_note=body.reason_note,
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
    )


# ------------------------------------------------------------------
# Property↔Agent assignments
# ------------------------------------------------------------------

@router.get("/{property_id}/agents", response_model=list[PropertyAgentResponse])
async def list_property_agents(
    property_id: UUID,
    tenant_id: TenantContext,
    svc: PropertyAgentService = Depends(_agent_svc),
) -> list[PropertyAgentResponse]:
    assignments = await svc.list_assignments(property_id, tenant_id)
    return [PropertyAgentResponse.model_validate(pa) for pa in assignments]


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


@router.put(
    "/{property_id}/agents/{agent_id}/commission-override",
    response_model=PropertyAgentResponse,
)
async def set_commission_override(
    property_id: UUID,
    agent_id: UUID,
    body: CommissionOverrideRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyAgentService = Depends(_agent_svc),
) -> PropertyAgentResponse:
    pa = await svc.set_commission_override(
        property_id, agent_id, tenant_id, current_user,
        commission_type=body.commission_type,
        commission_value=body.commission_value,
    )
    return PropertyAgentResponse.model_validate(pa)


@router.delete("/{property_id}/agents/{agent_id}/commission-override", status_code=204)
async def clear_commission_override(
    property_id: UUID,
    agent_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: PropertyAgentService = Depends(_agent_svc),
) -> None:
    await svc.clear_commission_override(property_id, agent_id, tenant_id, current_user)
