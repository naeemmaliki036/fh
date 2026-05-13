"""Listing review/approval workflow routes.

POST /listings/{listing_id}/submit-for-review
POST /listings/{listing_id}/review-decision
POST /listings/{listing_id}/publish
GET  /users/eligible-reviewers  (reviewer picker)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession, TenantContext
from apps.api.schemas.listing import ListingResponse
from apps.api.schemas.listing_review import (
    EligibleReviewerListResponse,
    EligibleReviewerResponse,
    ReviewDecisionRequest,
    SubmitForReviewRequest,
)
from apps.api.services.listing_review_service import ListingReviewService
from packages.common.storage import get_public_storage

router = APIRouter()


def _svc(db: DbSession) -> ListingReviewService:
    return ListingReviewService(db)


def _hero_url(listing) -> str | None:
    m = listing.hero_media
    if m is None:
        return None
    if m.storage_key.startswith(("http://", "https://")):
        return m.storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{m.storage_key}"
    return f"/_local-public/{m.storage_key}"


def _to_resp(listing) -> ListingResponse:
    return ListingResponse.model_validate({
        **listing.__dict__,
        "hero_media_url": _hero_url(listing),
        "thumbnail_url": None,
        "thumbnail_kind": None,
    })


# ------------------------------------------------------------------
# Submit for review
# ------------------------------------------------------------------

@router.post(
    "/listings/{listing_id}/submit-for-review",
    response_model=ListingResponse,
    tags=["listings"],
)
async def submit_for_review(
    listing_id: UUID,
    body: SubmitForReviewRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingReviewService = Depends(_svc),
) -> ListingResponse:
    """Transition draft/changes_requested → pending_review."""
    listing = await svc.submit_for_review(
        listing_id,
        tenant_id,
        current_user,
        reviewer_id=body.reviewer_id,
        note=body.note,
    )
    return _to_resp(listing)


# ------------------------------------------------------------------
# Review decision
# ------------------------------------------------------------------

@router.post(
    "/listings/{listing_id}/review-decision",
    response_model=ListingResponse,
    tags=["listings"],
)
async def review_decision(
    listing_id: UUID,
    body: ReviewDecisionRequest,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingReviewService = Depends(_svc),
) -> ListingResponse:
    """Reviewer decides: pending_review → approved | changes_requested."""
    listing = await svc.review_decision(
        listing_id,
        tenant_id,
        current_user,
        decision=body.decision,
        note=body.note,
    )
    return _to_resp(listing)


# ------------------------------------------------------------------
# Publish (approved → active)
# ------------------------------------------------------------------

@router.post(
    "/listings/{listing_id}/publish",
    response_model=ListingResponse,
    tags=["listings"],
)
async def publish_listing(
    listing_id: UUID,
    current_user: CurrentUser,
    tenant_id: TenantContext,
    svc: ListingReviewService = Depends(_svc),
) -> ListingResponse:
    """Publish an approved listing (approved → active)."""
    listing = await svc.publish(listing_id, tenant_id, current_user)
    return _to_resp(listing)


# ------------------------------------------------------------------
# Eligible reviewer picker
# ------------------------------------------------------------------

@router.get(
    "/users/eligible-reviewers",
    response_model=EligibleReviewerListResponse,
    tags=["users"],
)
async def list_eligible_reviewers(
    tenant_id: TenantContext,
    current_user: CurrentUser,  # noqa: ARG001 — auth required
    svc: ListingReviewService = Depends(_svc),
) -> EligibleReviewerListResponse:
    """Return users eligible to review listings (listing_manager, company_admin, company_owner)."""
    users = await svc.list_eligible_reviewers(tenant_id)
    items = [
        EligibleReviewerResponse(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role.value,
        )
        for u in users
    ]
    return EligibleReviewerListResponse(items=items, total=len(items))
