"""Open houses router.

Routes:
  POST  /listings/{listing_id}/open-houses         → 201 OpenHouseResponse
  GET   /listings/{listing_id}/open-houses          → OpenHouseListResponse
  PATCH /open-houses/{id}                           → OpenHouseResponse
  POST  /open-houses/{id}/cancel                    → OpenHouseResponse
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.schemas.open_house import (
    OpenHouseCancelRequest,
    OpenHouseCreate,
    OpenHouseListResponse,
    OpenHouseResponse,
    OpenHouseUpdate,
)
from apps.api.services.open_house_service import OpenHouseService

router = APIRouter()


def _svc(db: DbSession) -> OpenHouseService:
    return OpenHouseService(db)


@router.post(
    "/listings/{listing_id}/open-houses",
    response_model=OpenHouseResponse,
    status_code=201,
)
async def create_open_house(
    listing_id: UUID,
    body: OpenHouseCreate,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: OpenHouseService = Depends(_svc),
) -> OpenHouseResponse:
    oh = await svc.create_open_house(
        listing_id=listing_id,
        tenant_id=tenant_id,
        current_user=current_user,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        capacity=body.capacity,
        notes=body.notes,
    )
    return OpenHouseResponse.model_validate(oh)


@router.get(
    "/listings/{listing_id}/open-houses",
    response_model=OpenHouseListResponse,
)
async def list_open_houses(
    listing_id: UUID,
    tenant_id: TenantContext,
    include_past: bool = Query(default=False),
    svc: OpenHouseService = Depends(_svc),
) -> OpenHouseListResponse:
    items = await svc.list_for_listing(listing_id, tenant_id, include_past=include_past)
    return OpenHouseListResponse(
        items=[OpenHouseResponse.model_validate(oh) for oh in items],
        total=len(items),
    )


@router.patch(
    "/open-houses/{open_house_id}",
    response_model=OpenHouseResponse,
)
async def update_open_house(
    open_house_id: UUID,
    body: OpenHouseUpdate,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: OpenHouseService = Depends(_svc),
) -> OpenHouseResponse:
    updates = body.model_dump(exclude_unset=True)
    oh = await svc.update_open_house(open_house_id, tenant_id, current_user, updates)
    return OpenHouseResponse.model_validate(oh)


@router.post(
    "/open-houses/{open_house_id}/cancel",
    response_model=OpenHouseResponse,
)
async def cancel_open_house(
    open_house_id: UUID,
    body: OpenHouseCancelRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: OpenHouseService = Depends(_svc),
) -> OpenHouseResponse:
    oh = await svc.cancel_open_house(
        open_house_id, tenant_id, current_user, reason=body.reason
    )
    return OpenHouseResponse.model_validate(oh)
