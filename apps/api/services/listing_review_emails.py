"""Listing review email helpers — fail-soft email queuing.

Extracted from ListingReviewService to keep that file under 300 LOC.
Called exclusively by listing_review_service — not a public API.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.listing import Listing
from apps.api.models.user import User

_log = logging.getLogger("fh.listing_review_emails")


async def queue_review_requested_email(
    session: AsyncSession,
    *,
    listing: Listing,
    reviewer_id: UUID,
    tenant_id: UUID,
    submitter_user_id: UUID,
    note: str | None,
) -> None:
    """Queue listing_review_requested email to the assigned reviewer (fail-soft)."""
    try:
        from apps.api.services.email_outbox_helper import queue_email  # noqa: PLC0415

        reviewer = (await session.execute(
            select(User).where(User.id == reviewer_id)
        )).scalar_one_or_none()
        submitter = (await session.execute(
            select(User).where(User.id == submitter_user_id)
        )).scalar_one_or_none()

        if reviewer is None:
            return

        note_block = f"<p><strong>Note:</strong> {note}</p>" if note else ""
        submitter_name = submitter.full_name if submitter else "A team member"
        subject = f"Review requested: {listing.title}"
        body_html = (
            f"<h2>You have a listing to review</h2>"
            f"<p>Hi {reviewer.full_name},</p>"
            f"<p><strong>{submitter_name}</strong> has submitted the listing "
            f"<strong>{listing.title}</strong> for your review.</p>"
            f"{note_block}"
            f"<p>Open in your portal to review.</p>"
        )
        await queue_email(
            session,
            template_key="listing_review_requested",
            recipient_email=reviewer.email,
            subject=subject,
            body_html=body_html,
            payload={
                "listing_id": str(listing.id),
                "reviewer_id": str(reviewer_id),
                "note": note or "",
            },
            tenant_id=tenant_id,
        )
    except Exception:
        _log.warning("queue_review_requested_email failed", exc_info=True)


async def queue_decision_email(
    session: AsyncSession,
    *,
    listing: Listing,
    decision: str,
    note: str | None,
    tenant_id: UUID,
) -> None:
    """Queue listing_review_decision email to the original submitter (fail-soft)."""
    try:
        from apps.api.services.email_outbox_helper import queue_email  # noqa: PLC0415

        if listing.submitted_for_review_by_user_id is None:
            return
        submitter = (await session.execute(
            select(User).where(User.id == listing.submitted_for_review_by_user_id)
        )).scalar_one_or_none()
        if submitter is None:
            return

        decision_label = "Approved" if decision == "approved" else "Changes Requested"
        note_block = f"<p><strong>Note:</strong> {note}</p>" if note else ""
        subject = f"Listing {decision_label}: {listing.title}"
        body_html = (
            f"<h2>Listing review decision</h2>"
            f"<p>Hi {submitter.full_name},</p>"
            f"<p>Your listing <strong>{listing.title}</strong> was reviewed and the "
            f"decision is <strong>{decision_label}</strong>.</p>"
            f"{note_block}"
            f"<p>Open in your portal to take action.</p>"
        )
        await queue_email(
            session,
            template_key="listing_review_decision",
            recipient_email=submitter.email,
            subject=subject,
            body_html=body_html,
            payload={
                "listing_id": str(listing.id),
                "decision": decision,
                "note": note or "",
            },
            tenant_id=tenant_id,
        )
    except Exception:
        _log.warning("queue_decision_email failed", exc_info=True)
