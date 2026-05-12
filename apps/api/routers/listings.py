"""Listings router — CRUD + lifecycle under /properties/{id}/listings and /listings/{id}."""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.schemas.listing import (
    ListingCreateRequest,
    ListingListResponse,
    ListingResponse,
    ListingUpdateRequest,
)
from apps.api.schemas.status_change import ListingStatusChangeRequest
from apps.api.services.listing_service import ListingService

router = APIRouter()


def _svc(db: DbSession) -> ListingService:
    return ListingService(db)


# ------------------------------------------------------------------
# Nested under /properties
# ------------------------------------------------------------------

@router.get("/properties/{property_id}/listings", response_model=ListingListResponse)
async def list_listings(
    property_id: UUID,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingListResponse:
    items, total = await svc.list_for_property(property_id, tenant_id)
    return ListingListResponse(
        items=[ListingResponse.model_validate(listing) for listing in items],
        total=total,
    )


@router.post("/properties/{property_id}/listings", response_model=ListingResponse, status_code=201)
async def create_listing(
    property_id: UUID,
    body: ListingCreateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    fields = body.model_dump()
    listing = await svc.create_listing(property_id, tenant_id, current_user, **fields)
    return ListingResponse.model_validate(listing)


# ------------------------------------------------------------------
# Flat /listings endpoints
# ------------------------------------------------------------------

@router.get("/listings/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: UUID,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return ListingResponse.model_validate(await svc.get_listing(listing_id, tenant_id))


@router.patch("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: UUID,
    body: ListingUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    updates = body.model_dump(exclude_unset=True)
    return ListingResponse.model_validate(
        await svc.update_listing(listing_id, tenant_id, current_user, updates)
    )


@router.delete("/listings/{listing_id}", status_code=204)
async def delete_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> None:
    await svc.archive_listing(listing_id, tenant_id, current_user)


# ------------------------------------------------------------------
# Lifecycle
# ------------------------------------------------------------------

@router.post("/listings/{listing_id}/activate", response_model=ListingResponse)
async def activate_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return ListingResponse.model_validate(
        await svc.activate(listing_id, tenant_id, current_user)
    )


@router.post("/listings/{listing_id}/pause", response_model=ListingResponse)
async def pause_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return ListingResponse.model_validate(
        await svc.pause(listing_id, tenant_id, current_user)
    )


@router.post("/listings/{listing_id}/archive", response_model=ListingResponse)
async def archive_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return ListingResponse.model_validate(
        await svc.archive(listing_id, tenant_id, current_user)
    )


@router.patch("/listings/{listing_id}/status", response_model=ListingResponse)
async def change_listing_status(
    listing_id: UUID,
    body: ListingStatusChangeRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return ListingResponse.model_validate(
        await svc.change_status(
            listing_id, tenant_id, current_user,
            new_status=body.status,
            reason_code=body.reason_code,
            reason_note=body.reason_note,
            ip_address=ctx.ip_address,
            user_agent=ctx.user_agent,
        )
    )
