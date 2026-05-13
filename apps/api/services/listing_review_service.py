"""Listing review/approval workflow service.

Status transition contract:
  draft | changes_requested  → pending_review       (submit_for_review)
  pending_review             → approved | changes_requested  (review_decision)
  approved                   → active               (publish)

Reviewer roles: listing_manager, company_admin, company_owner.
Email side-effects are delegated to listing_review_emails (fail-soft).
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.models.enums import AuditAction, ListingStatus, TenantRole, UserStatus
from apps.api.models.listing import Listing
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.listing_review_emails import (
    queue_decision_email,
    queue_review_requested_email,
)
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_REVIEWER_ROLES: set[str] = {
    TenantRole.LISTING_MANAGER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.COMPANY_OWNER.value,
}

# Statuses that lock the listing against regular edits.
# Imported by listing_service to enforce the block.
LOCKED_FOR_EDIT_STATUSES: set[ListingStatus] = {
    ListingStatus.PENDING_REVIEW,
    ListingStatus.APPROVED,
}

_SUBMIT_FROM: set[ListingStatus] = {ListingStatus.DRAFT, ListingStatus.CHANGES_REQUESTED}
_REVIEW_FROM: set[ListingStatus] = {ListingStatus.PENDING_REVIEW}
_PUBLISH_FROM: set[ListingStatus] = {ListingStatus.APPROVED}


class ListingReviewService(BaseService):
    """Review/approval workflow — one domain, one service."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _now(self) -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    def _require_reviewer_role(self, current_user: dict) -> None:
        if current_user.get("role") not in _REVIEWER_ROLES:
            raise forbidden("listing_manager, company_admin, or company_owner required")

    async def _get_listing(self, listing_id: UUID, tenant_id: UUID) -> Listing:
        stmt = (
            select(Listing)
            .options(selectinload(Listing.hero_media))
            .where(Listing.id == listing_id, Listing.tenant_id == tenant_id)
        )
        listing = (await self.session.execute(stmt)).scalar_one_or_none()
        if listing is None:
            raise not_found("Listing")
        return listing

    async def _get_eligible_reviewer(
        self, reviewer_id: UUID, tenant_id: UUID
    ) -> User:
        stmt = select(User).where(
            User.id == reviewer_id,
            User.tenant_id == tenant_id,
            User.status == UserStatus.ACTIVE,
        )
        user = (await self.session.execute(stmt)).scalar_one_or_none()
        if user is None:
            raise not_found("Reviewer user")
        if user.role.value not in _REVIEWER_ROLES:
            raise bad_request(
                f"User {reviewer_id} does not have a reviewer role "
                f"({', '.join(sorted(_REVIEWER_ROLES))} required)"
            )
        return user

    # ------------------------------------------------------------------
    # submit-for-review  (draft | changes_requested → pending_review)
    # ------------------------------------------------------------------

    async def submit_for_review(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        reviewer_id: UUID,
        note: str | None = None,
    ) -> Listing:
        listing = await self._get_listing(listing_id, tenant_id)

        if listing.status not in _SUBMIT_FROM:
            raise bad_request(
                f"submit-for-review requires status draft or changes_requested "
                f"(current: {listing.status.value})"
            )

        await self._get_eligible_reviewer(reviewer_id, tenant_id)

        actor_id = UUID(current_user["id"])
        now = self._now()
        listing.status = ListingStatus.PENDING_REVIEW
        listing.submitted_for_review_at = now
        listing.submitted_for_review_by_user_id = actor_id
        listing.assigned_reviewer_id = reviewer_id
        listing.reviewed_at = None
        listing.reviewed_by_user_id = None
        listing.review_notes = None

        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_SUBMITTED_FOR_REVIEW,
            tenant_id=tenant_id,
            actor_user_id=actor_id,
            entity_type="listing",
            entity_id=listing.id,
            after={
                "from": "draft_or_changes_requested",
                "to": ListingStatus.PENDING_REVIEW.value,
                "reviewer_id": str(reviewer_id),
                "note": note,
            },
        )

        await queue_review_requested_email(
            self.session,
            listing=listing,
            reviewer_id=reviewer_id,
            tenant_id=tenant_id,
            submitter_user_id=actor_id,
            note=note,
        )

        return listing

    # ------------------------------------------------------------------
    # review-decision  (pending_review → approved | changes_requested)
    # ------------------------------------------------------------------

    async def review_decision(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        decision: str,
        note: str | None = None,
    ) -> Listing:
        self._require_reviewer_role(current_user)
        listing = await self._get_listing(listing_id, tenant_id)

        if listing.status not in _REVIEW_FROM:
            raise bad_request(
                f"review-decision requires status pending_review "
                f"(current: {listing.status.value})"
            )

        if decision not in {"approved", "changes_requested"}:
            raise bad_request("decision must be 'approved' or 'changes_requested'")

        new_status = (
            ListingStatus.APPROVED
            if decision == "approved"
            else ListingStatus.CHANGES_REQUESTED
        )
        actor_id = UUID(current_user["id"])
        listing.status = new_status
        listing.reviewed_at = self._now()
        listing.reviewed_by_user_id = actor_id
        listing.review_notes = note

        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_REVIEW_DECISION,
            tenant_id=tenant_id,
            actor_user_id=actor_id,
            entity_type="listing",
            entity_id=listing.id,
            after={
                "from": ListingStatus.PENDING_REVIEW.value,
                "to": new_status.value,
                "decision": decision,
                "note": note,
            },
        )

        await queue_decision_email(
            self.session,
            listing=listing,
            decision=decision,
            note=note,
            tenant_id=tenant_id,
        )

        return listing

    # ------------------------------------------------------------------
    # publish  (approved → active)
    # ------------------------------------------------------------------

    async def publish(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
    ) -> Listing:
        listing = await self._get_listing(listing_id, tenant_id)

        if listing.status not in _PUBLISH_FROM:
            raise bad_request(
                f"publish requires status approved (current: {listing.status.value})"
            )

        listing.status = ListingStatus.ACTIVE
        await self.session.flush()

        await self._audit.record(
            AuditAction.LISTING_PUBLISHED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing",
            entity_id=listing.id,
            after={"from": ListingStatus.APPROVED.value, "to": ListingStatus.ACTIVE.value},
        )

        return listing

    # ------------------------------------------------------------------
    # Eligible reviewers query (for reviewer picker dropdown)
    # ------------------------------------------------------------------

    async def list_eligible_reviewers(self, tenant_id: UUID) -> list[User]:
        stmt = (
            select(User)
            .where(
                User.tenant_id == tenant_id,
                User.status == UserStatus.ACTIVE,
                User.role.in_(list(_REVIEWER_ROLES)),
            )
            .order_by(User.full_name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
