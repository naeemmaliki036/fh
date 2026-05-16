"""Consumer listings router — CRUD + status for self-posted listings.

Prefix: /consumer  (mounted in main.py)
Routes: /consumer/me/listings, /consumer/me/listings/{listing_id}, ...
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import DbSession
from apps.api.consumer_deps import CurrentConsumer
from apps.api.schemas.consumer_listing import (
    ConsumerListingCreateRequest,
    ConsumerListingListResponse,
    ConsumerListingResponse,
    ConsumerListingUpdateRequest,
    MarkStatusRequest,
)
from apps.api.services.consumer_listing_service import ConsumerListingService

router = APIRouter()


def _svc(db: DbSession) -> ConsumerListingService:
    return ConsumerListingService(db)


@router.get("/me/listings", response_model=ConsumerListingListResponse)
async def list_my_listings(
    consumer: CurrentConsumer,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingListResponse:
    """Paginated list of the authenticated consumer's listings."""
    data = await svc.list_my_listings(
        consumer.id, page=page, page_size=page_size
    )
    items = [ConsumerListingResponse(**item) for item in data["items"]]
    return ConsumerListingListResponse(
        items=items, total=data["total"], active_count=data["active_count"]
    )


@router.post("/me/listings", response_model=ConsumerListingResponse, status_code=201)
async def create_listing(
    body: ConsumerListingCreateRequest,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingResponse:
    """Create a new self-posted listing. Max 10 active listings per consumer."""
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
    """Partial-update a consumer's own listing."""
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
    "/me/listings/{listing_id}/mark-status",
    response_model=ConsumerListingResponse,
)
async def mark_status(
    listing_id: UUID,
    body: MarkStatusRequest,
    consumer: CurrentConsumer,
    svc: ConsumerListingService = Depends(_svc),
) -> ConsumerListingResponse:
    """Mark a listing as sold, rented, paused, or active."""
    data = await svc.mark_status(consumer.id, listing_id, body.status)
    return ConsumerListingResponse(**data)
