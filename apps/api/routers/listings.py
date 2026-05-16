"""Listings router — CRUD + lifecycle under /properties/{id}/listings and /listings/{id}."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.models.enums import (
    CompletionStatus,
    FurnishingStatus,
    ListingPurpose,
    ListingStatus,
    ListingTier,
    PropertyType,
    ViewOrientation,
)
from apps.api.models.listing import Listing
from apps.api.schemas.listing import (
    ListingCreateRequest,
    ListingListResponse,
    ListingResponse,
    ListingUpdateRequest,
    ListingVerifyRequest,
)
from apps.api.schemas.status_change import ListingStatusChangeRequest
from apps.api.services.listing_service import ListingService
from apps.api.services.listing_verify_service import ListingVerifyService
from packages.common.storage import get_public_storage

router = APIRouter()


def _svc(db: DbSession) -> ListingService:
    return ListingService(db)


def _verify_svc(db: DbSession) -> ListingVerifyService:
    return ListingVerifyService(db)


def _hero_url(listing: Listing) -> str | None:
    """Assemble CDN URL for hero_media if loaded."""
    m = listing.hero_media
    if m is None:
        return None
    if m.storage_key.startswith(("http://", "https://")):
        return m.storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{m.storage_key}"
    return f"/_local-public/{m.storage_key}"


def _to_resp(
    listing: Listing,
    thumbnails: dict | None = None,
    enrichments: dict | None = None,
) -> ListingResponse:
    thumb = (thumbnails or {}).get(str(listing.id), {})
    update: dict = {
        "hero_media_url": _hero_url(listing),
        "thumbnail_url": thumb.get("thumbnail_url"),
        "thumbnail_kind": thumb.get("thumbnail_kind"),
    }
    if enrichments:
        update.update(enrichments)
    return ListingResponse.model_validate(listing).model_copy(update=update)


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
    thumbnails = await svc.batch_fallback_thumbnails(items)
    return ListingListResponse(items=[_to_resp(l, thumbnails) for l in items], total=total)


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
    return _to_resp(listing)


# ------------------------------------------------------------------
# Flat /listings endpoints
# ------------------------------------------------------------------

@router.get("/listings", response_model=ListingListResponse)
async def list_all_listings(
    tenant_id: TenantContext,
    status: ListingStatus | None = Query(None),
    purpose: ListingPurpose | None = Query(None),
    listing_tier: ListingTier | None = Query(None),
    assigned_agent_id: UUID | None = Query(None),
    assigned_reviewer_id: UUID | None = Query(None, description="Filter by assigned reviewer (for 'my reviews' view)"),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    currency: str | None = Query(None, max_length=8),
    country: str | None = Query(None),
    city: str | None = Query(None),
    area: str | None = Query(None),
    created_from: date | None = Query(None),
    created_to: date | None = Query(None),
    valid_from_to: date | None = Query(None, description="Listings whose valid_from <= this date"),
    valid_until_from: date | None = Query(None, description="Listings whose valid_until >= this date"),
    q: str | None = Query(None),
    # --- migration 0039 property-attribute filters ---
    property_type: PropertyType | None = Query(None),
    min_bedrooms: int | None = Query(None, ge=0),
    max_bedrooms: int | None = Query(None, ge=0),
    min_bathrooms: int | None = Query(None, ge=0),
    max_bathrooms: int | None = Query(None, ge=0),
    amenities: str | None = Query(None, description="CSV of amenity keys; row must include ALL"),
    furnishing_status: FurnishingStatus | None = Query(None),
    completion_status: CompletionStatus | None = Query(None),
    view_orientation: ViewOrientation | None = Query(None),
    # migration 0040 filters
    is_verified: bool | None = Query(None),
    rent_cheque_count: int | None = Query(None),
    min_build_year: int | None = Query(None),
    max_build_year: int | None = Query(None),
    has_floor_plan: bool | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|updated_at|price|title)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    svc: ListingService = Depends(_svc),
) -> ListingListResponse:
    amenity_list = [a.strip() for a in amenities.split(",") if a.strip()] if amenities else None
    items, total = await svc.list_listings(
        tenant_id,
        status=status,
        purpose=purpose,
        listing_tier=listing_tier,
        assigned_agent_id=assigned_agent_id,
        assigned_reviewer_id=assigned_reviewer_id,
        min_price=min_price,
        max_price=max_price,
        currency=currency,
        country=country,
        city=city,
        area=area,
        created_from=created_from,
        created_to=created_to,
        valid_from_to=valid_from_to,
        valid_until_from=valid_until_from,
        q=q,
        property_type=property_type,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        min_bathrooms=min_bathrooms,
        max_bathrooms=max_bathrooms,
        amenities=amenity_list,
        furnishing_status=furnishing_status.value if furnishing_status else None,
        completion_status=completion_status.value if completion_status else None,
        view_orientation=view_orientation.value if view_orientation else None,
        is_verified=is_verified,
        rent_cheque_count=rent_cheque_count,
        min_build_year=min_build_year,
        max_build_year=max_build_year,
        has_floor_plan=has_floor_plan,
        sort_by=sort_by,
        sort_dir=sort_dir,
        skip=skip,
        limit=limit,
    )
    thumbnails = await svc.batch_fallback_thumbnails(items)
    return ListingListResponse(items=[_to_resp(l, thumbnails) for l in items], total=total)


@router.get("/listings/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: UUID,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
    vsvc: ListingVerifyService = Depends(_verify_svc),
) -> ListingResponse:
    listing = await svc.get_listing(listing_id, tenant_id)
    enrichments = await vsvc.compute_enrichments(listing)
    return _to_resp(listing, enrichments=enrichments)


@router.patch("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: UUID,
    body: ListingUpdateRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    updates = body.model_dump(exclude_unset=True)
    return _to_resp(await svc.update_listing(listing_id, tenant_id, current_user, updates))


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
    return _to_resp(await svc.activate(listing_id, tenant_id, current_user))


@router.post("/listings/{listing_id}/pause", response_model=ListingResponse)
async def pause_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return _to_resp(await svc.pause(listing_id, tenant_id, current_user))


@router.post("/listings/{listing_id}/archive", response_model=ListingResponse)
async def archive_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return _to_resp(await svc.archive(listing_id, tenant_id, current_user))


@router.patch("/listings/{listing_id}/status", response_model=ListingResponse)
async def change_listing_status(
    listing_id: UUID,
    body: ListingStatusChangeRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: ListingService = Depends(_svc),
) -> ListingResponse:
    return _to_resp(await svc.change_status(
        listing_id, tenant_id, current_user,
        new_status=body.status,
        reason_code=body.reason_code,
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    ))


# ------------------------------------------------------------------
# Verification endpoints (migration 0040)
# ------------------------------------------------------------------


@router.post("/listings/{listing_id}/verify", response_model=ListingResponse)
async def verify_listing(
    listing_id: UUID,
    body: ListingVerifyRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    vsvc: ListingVerifyService = Depends(_verify_svc),
) -> ListingResponse:
    """Mark a listing as verified (company_owner / company_admin / listing_manager).

    Returns 422 if the listing is already verified.
    """
    listing = await vsvc.verify(listing_id, tenant_id, current_user, note=body.note)
    enrichments = await vsvc.compute_enrichments(listing)
    return _to_resp(listing, enrichments=enrichments)


@router.post("/listings/{listing_id}/unverify", response_model=ListingResponse)
async def unverify_listing(
    listing_id: UUID,
    body: ListingVerifyRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    vsvc: ListingVerifyService = Depends(_verify_svc),
) -> ListingResponse:
    """Remove verification from a listing (company_owner / company_admin / listing_manager).

    Returns 422 if the listing is not currently verified.
    """
    listing = await vsvc.unverify(listing_id, tenant_id, current_user, note=body.note)
    enrichments = await vsvc.compute_enrichments(listing)
    return _to_resp(listing, enrichments=enrichments)
