"""Listing price-change + price-history + hero-media endpoints.

Kept separate from listings.py to stay under 300 LOC.
Mounted with prefix="" (no prefix) so paths match /listings/{id}/price etc.
"""

from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentUser, DbSession, ReqCtx, TenantContext
from apps.api.models.listing import Listing
from apps.api.schemas.listing import (
    ListingHeroMediaRequest,
    ListingPriceChangeRequest,
    ListingPriceHistoryListResponse,
    ListingPriceHistoryResponse,
    ListingResponse,
)
from apps.api.services.listing_price_service import ListingPriceService
from packages.common.storage import get_public_storage

router = APIRouter()


def _svc(db: DbSession) -> ListingPriceService:
    return ListingPriceService(db)


def _hero_url(listing: Listing) -> str | None:
    m = listing.hero_media
    if m is None:
        return None
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{m.storage_key}"
    return f"/_local-public/{m.storage_key}"


def _to_resp(listing: Listing) -> ListingResponse:
    return ListingResponse.model_validate({
        **listing.__dict__,
        "hero_media_url": _hero_url(listing),
    })


# ------------------------------------------------------------------
# Price change
# ------------------------------------------------------------------

@router.patch("/listings/{listing_id}/price", response_model=ListingResponse)
async def change_listing_price(
    listing_id: UUID,
    body: ListingPriceChangeRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: ListingPriceService = Depends(_svc),
) -> ListingResponse:
    """Change listing price; creates ListingPriceHistory + AuditLog row atomically.

    409 if new_price equals current price.
    """
    listing = await svc.change_price(
        listing_id, tenant_id, current_user,
        new_price=body.new_price,
        reason_note=body.reason_note,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _to_resp(listing)


# ------------------------------------------------------------------
# Price history
# ------------------------------------------------------------------

@router.get("/listings/{listing_id}/price-history", response_model=ListingPriceHistoryListResponse)
async def get_price_history(
    listing_id: UUID,
    tenant_id: TenantContext,
    svc: ListingPriceService = Depends(_svc),
) -> ListingPriceHistoryListResponse:
    """Return price-change history for a listing, most recent first."""
    rows, total = await svc.get_price_history(listing_id, tenant_id)
    return ListingPriceHistoryListResponse(
        items=[ListingPriceHistoryResponse.model_validate(r) for r in rows],
        total=total,
    )


# ------------------------------------------------------------------
# Hero media
# ------------------------------------------------------------------

@router.patch("/listings/{listing_id}/hero-media", response_model=ListingResponse)
async def set_hero_media(
    listing_id: UUID,
    body: ListingHeroMediaRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    ctx: ReqCtx,
    svc: ListingPriceService = Depends(_svc),
) -> ListingResponse:
    """Pin or clear the hero media for a listing.

    media_id must belong to the listing's property (same tenant).
    Pass null to clear.
    """
    listing = await svc.set_hero_media(
        listing_id, tenant_id, current_user,
        media_id=body.media_id,
        ip_address=ctx.ip_address,
        user_agent=ctx.user_agent,
    )
    return _to_resp(listing)
