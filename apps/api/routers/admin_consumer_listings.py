"""Platform-admin consumer listings moderation router.

Prefix: /platform-admin/consumer-listings  (mounted in main.py)
All routes require any platform admin role.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import DbSession
from apps.api.models.enums import PlatformRole
from apps.api.schemas.consumer_listing import (
    AdminConsumerListingDetail,
    AdminConsumerListingQueueResponse,
    ModerationActionResponse,
    RequestChangesBody,
)
from apps.api.security.platform_roles import ALL_PLATFORM_ROLES, require_platform_role
from apps.api.services.consumer_listing_moderation_service import (
    ConsumerListingModerationService,
)

router = APIRouter()

# Any platform role can access the moderation queue
_AnyPlatformAdmin = Annotated[
    dict, Depends(require_platform_role(*ALL_PLATFORM_ROLES))
]


def _svc(db: DbSession) -> ConsumerListingModerationService:
    return ConsumerListingModerationService(db)


@router.get("", response_model=AdminConsumerListingQueueResponse)
async def list_consumer_listings(
    admin: _AnyPlatformAdmin,
    status: str = Query(default="pending_review"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    svc: ConsumerListingModerationService = Depends(_svc),
) -> AdminConsumerListingQueueResponse:
    """List consumer listings filtered by status (default: pending_review).

    Ordered by submitted_at ASC (oldest first) so reviewers work FIFO.
    """
    data = await svc.list_queue(status=status, page=page, page_size=page_size)
    return AdminConsumerListingQueueResponse(**data)


@router.get("/{listing_id}", response_model=AdminConsumerListingDetail)
async def get_consumer_listing(
    listing_id: UUID,
    admin: _AnyPlatformAdmin,
    svc: ConsumerListingModerationService = Depends(_svc),
) -> AdminConsumerListingDetail:
    """Full detail of a consumer listing for admin review."""
    data = await svc.get_detail(listing_id)
    return AdminConsumerListingDetail(**data)


@router.post(
    "/{listing_id}/approve",
    response_model=ModerationActionResponse,
)
async def approve_consumer_listing(
    listing_id: UUID,
    admin: _AnyPlatformAdmin,
    svc: ConsumerListingModerationService = Depends(_svc),
) -> ModerationActionResponse:
    """Approve a pending_review consumer listing.

    Sets status=active, records reviewed_at, sets expires_at if first approval.
    Queues an email to the listing owner.
    """
    data = await svc.approve(listing_id, UUID(admin["id"]))
    return ModerationActionResponse(**data)


@router.post(
    "/{listing_id}/request-changes",
    response_model=ModerationActionResponse,
)
async def request_changes_on_consumer_listing(
    listing_id: UUID,
    body: RequestChangesBody,
    admin: _AnyPlatformAdmin,
    svc: ConsumerListingModerationService = Depends(_svc),
) -> ModerationActionResponse:
    """Request changes on a pending_review consumer listing.

    Sets status=changes_requested, saves review_notes, queues email to owner.
    """
    data = await svc.request_changes(listing_id, UUID(admin["id"]), body.notes)
    return ModerationActionResponse(**data)
