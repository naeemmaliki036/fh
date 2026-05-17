"""Consumer listings router — CRUD + status + submit + media for self-posted listings.

Prefix: /consumer  (mounted in main.py)
Routes: /consumer/me/listings, /consumer/me/listings/{listing_id}, ...
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from apps.api.consumer_deps import CurrentConsumer
from apps.api.dependencies import DbSession
from apps.api.schemas.consumer_listing import (
    ConsumerListingCreateRequest,
    ConsumerListingListResponse,
    ConsumerListingResponse,
    ConsumerListingUpdateRequest,
    ConsumerMediaListResponse,
    ConsumerMediaReorderRequest,
    ConsumerMediaResponse,
    MarkStatusRequest,
)
from apps.api.services.consumer_listing_media_service import ConsumerListingMediaService
from apps.api.services.consumer_listing_moderation_service import (
    ConsumerListingModerationService,
)
from apps.api.services.consumer_listing_service import ConsumerListingService

router = APIRouter()


def _svc(db: DbSession) -> ConsumerListingService:
    return ConsumerListingService(db)


def _media_svc(db: DbSession) -> ConsumerListingMediaService:
    return ConsumerListingMediaService(db)


def _mod_svc(db: DbSession) -> ConsumerListingModerationService:
    return ConsumerListingModerationService(db)


# ---------------------------------------------------------------------------
# Listing CRUD
# ---------------------------------------------------------------------------


@router.get("/me/listings", response_model=ConsumerListingListResponse)
async def list_my_listings(
    consumer: CurrentConsumer,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingListResponse:
    """Paginated list of the authenticated consumer's listings (all statuses)."""
    data = await svc.list_my_listings(
        consumer.id, page=page, page_size=page_size
    )
    items = [ConsumerListingResponse(**item) for item in data["items"]]
    return ConsumerListingListResponse(
        items=items, total=data["total"], active_count=data["active_count"]
    )


@router.get("/me/listings/{listing_id}", response_model=ConsumerListingResponse)
async def get_listing(
    listing_id: UUID,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingResponse:
    """Fetch a single consumer listing (any status — owner sees draft/pending too)."""
    data = await svc.get_listing(consumer.id, listing_id)
    return ConsumerListingResponse(**data)


@router.post("/me/listings", response_model=ConsumerListingResponse, status_code=201)
async def create_listing(
    body: ConsumerListingCreateRequest,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingResponse:
    """Create a new self-posted listing. Lands in DRAFT status."""
    data = await svc.create_listing(
        consumer.id, body.model_dump(exclude_unset=False)
    )
    return ConsumerListingResponse(**data)


@router.patch(
    "/me/listings/{listing_id}", response_model=ConsumerListingResponse
)
async def update_listing(
    listing_id: UUID,
    body: ConsumerListingUpdateRequest,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingResponse:
    """Partial-update a consumer's own listing.

    If the listing was active, it will transition to pending_review for re-review.
    """
    data = await svc.update_listing(
        consumer.id, listing_id, body.model_dump(exclude_unset=True)
    )
    return ConsumerListingResponse(**data)


@router.delete("/me/listings/{listing_id}", status_code=204)
async def delete_listing(
    listing_id: UUID,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> None:
    """Soft-archive a consumer's own listing (preserves lead history)."""
    await svc.delete_listing(consumer.id, listing_id)


@router.post(
    "/me/listings/{listing_id}/submit",
    response_model=ConsumerListingResponse,
)
async def submit_listing(
    listing_id: UUID,
    consumer: CurrentConsumer,
    svc: ConsumerListingModerationService = Depends(_mod_svc),
) -> ConsumerListingResponse:
    """Submit a draft or changes_requested listing for platform review."""
    data = await svc.submit_listing(consumer.id, listing_id)
    return ConsumerListingResponse(**data)


@router.post(
    "/me/listings/{listing_id}/mark-status",
    response_model=ConsumerListingResponse,
)
async def mark_status(
    listing_id: UUID,
    body: MarkStatusRequest,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingResponse:
    """Mark a listing as sold, rented, paused, or active.

    Cannot mark as active unless the listing was previously approved (reviewed_at IS NOT NULL).
    """
    data = await svc.mark_status(consumer.id, listing_id, body.status)
    return ConsumerListingResponse(**data)


# ---------------------------------------------------------------------------
# Media endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/me/listings/{listing_id}/media",
    response_model=ConsumerMediaListResponse,
)
async def list_listing_media(
    listing_id: UUID,
    consumer: CurrentConsumer,
    svc: ConsumerListingMediaService = Depends(_media_svc),
) -> ConsumerMediaListResponse:
    """List all media for a consumer's listing."""
    items = await svc.list_media(consumer.id, listing_id)
    return ConsumerMediaListResponse(
        items=[ConsumerMediaResponse(**m) for m in items],
        total=len(items),
    )


@router.post(
    "/me/listings/{listing_id}/media",
    response_model=ConsumerMediaResponse,
    status_code=201,
)
async def upload_listing_media(
    listing_id: UUID,
    consumer: CurrentConsumer,
    file: UploadFile = File(...),
    svc: ConsumerListingMediaService = Depends(_media_svc),
) -> ConsumerMediaResponse:
    """Upload an image for a consumer's listing (jpeg/png/webp, max 10 MB)."""
    data = await file.read()
    mime = file.content_type or "application/octet-stream"
    result = await svc.upload(
        consumer.id, listing_id, data, file.filename or "upload", mime
    )
    return ConsumerMediaResponse(**result)


@router.delete("/me/listings/{listing_id}/media/{media_id}", status_code=204)
async def delete_listing_media(
    listing_id: UUID,
    media_id: UUID,
    consumer: CurrentConsumer,
    svc: ConsumerListingMediaService = Depends(_media_svc),
) -> None:
    """Delete a media item from a consumer's listing."""
    await svc.delete_media(consumer.id, listing_id, media_id)


@router.post(
    "/me/listings/{listing_id}/media/reorder",
    response_model=ConsumerMediaListResponse,
)
async def reorder_listing_media(
    listing_id: UUID,
    body: ConsumerMediaReorderRequest,
    consumer: CurrentConsumer,
    svc: ConsumerListingMediaService = Depends(_media_svc),
) -> ConsumerMediaListResponse:
    """Reorder media items for a consumer's listing."""
    items = await svc.reorder(consumer.id, listing_id, body.ordered_ids)
    return ConsumerMediaListResponse(
        items=[ConsumerMediaResponse(**m) for m in items],
        total=len(items),
    )
