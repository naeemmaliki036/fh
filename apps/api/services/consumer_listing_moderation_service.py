"""Consumer listing moderation service — review workflow for consumer listings.

Consumer: submit_listing (draft/changes_requested → pending_review).
Admin: list_queue, get_detail, approve, request_changes.
Dict builders: consumer_listing_admin_helpers.py.
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.consumer_account import ConsumerAccount
from apps.api.models.enums import AuditAction, ListingStatus
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.consumer_listing_admin_helpers import (
    approval_email_html,
    changes_email_html,
    detail_dict,
    queue_item,
)
from apps.api.services.consumer_listing_helpers import (
    fetch_listing_media,
    listing_to_dict,
)
from apps.api.services.email_outbox_helper import queue_email
from packages.common.utils.error_handlers import bad_request, not_found

_SUBMITTABLE = {ListingStatus.DRAFT, ListingStatus.CHANGES_REQUESTED}

_EXPIRY_DAYS = 60


class ConsumerListingModerationService(BaseService):
    """Platform-admin operations on consumer listings."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)
        self._ppd_id: UUID | None = None

    async def _resolve_ppd(self) -> UUID:
        if self._ppd_id is not None:
            return self._ppd_id
        row = (
            await self.session.execute(
                select(Tenant.id).where(Tenant.slug == "propertypoint-direct")
            )
        ).scalar_one_or_none()
        if row is None:
            raise RuntimeError("propertypoint-direct tenant not seeded")
        self._ppd_id = row
        return self._ppd_id

    # -- Consumer: submit for review --

    async def submit_listing(
        self, consumer_id: UUID, listing_id: UUID
    ) -> dict:
        """Transition a consumer's draft/changes_requested listing to pending_review."""
        ppd_id = await self._resolve_ppd()
        row = (
            await self.session.execute(
                select(Listing, Property)
                .join(Property, Listing.property_id == Property.id)
                .where(
                    Listing.id == listing_id,
                    Listing.consumer_account_id == consumer_id,
                )
            )
        ).one_or_none()
        if row is None:
            raise not_found("Listing")
        listing, prop = row

        if listing.status not in _SUBMITTABLE:
            raise bad_request(
                f"Cannot submit listing with status '{listing.status.value}'. "
                "Only draft or changes_requested listings may be submitted."
            )

        prev_status = listing.status
        now = datetime.now(UTC)
        listing.status = ListingStatus.PENDING_REVIEW
        listing.submitted_at = now

        action = (
            AuditAction.CONSUMER_LISTING_RESUBMITTED
            if prev_status == ListingStatus.CHANGES_REQUESTED
            else AuditAction.CONSUMER_LISTING_SUBMITTED_FOR_REVIEW
        )
        await self._audit.record(
            action,
            tenant_id=ppd_id,
            entity_type="listing",
            entity_id=listing.id,
            before={"status": prev_status.value},
            after={"status": "pending_review", "submitted_at": now.isoformat()},
        )

        await self.session.flush()
        await self.session.refresh(listing)
        await self.session.refresh(prop)
        media_rows = await fetch_listing_media(self.session, prop.id)
        return listing_to_dict(listing, prop, media_rows)

    async def _get_listing_with_owner(
        self, listing_id: UUID
    ) -> tuple[Listing, Property, ConsumerAccount]:
        row = (
            await self.session.execute(
                select(Listing, Property)
                .join(Property, Listing.property_id == Property.id)
                .where(
                    Listing.id == listing_id,
                    Listing.consumer_account_id.isnot(None),
                )
            )
        ).one_or_none()
        if row is None:
            raise not_found("Consumer listing")
        listing, prop = row
        owner = await self.session.get(ConsumerAccount, listing.consumer_account_id)
        if owner is None:
            raise not_found("Consumer account")
        return listing, prop, owner

    # -- Admin: moderation queue --

    async def list_queue(
        self,
        *,
        status: str = "pending_review",
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        try:
            filter_status = ListingStatus(status)
        except ValueError:
            raise bad_request(f"Invalid status filter: {status}")

        base = (
            select(Listing, Property, ConsumerAccount)
            .join(Property, Listing.property_id == Property.id)
            .join(ConsumerAccount, Listing.consumer_account_id == ConsumerAccount.id)
            .where(
                Listing.consumer_account_id.isnot(None),
                Listing.status == filter_status,
            )
        )
        total = (
            await self.session.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()

        rows = (
            await self.session.execute(
                base.order_by(Listing.submitted_at.asc().nullslast())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()

        items = []
        for listing, prop, owner in rows:
            media_count = (
                await self.session.execute(
                    select(func.count()).where(Media.property_id == prop.id)
                )
            ).scalar_one()
            items.append(queue_item(listing, prop, owner, int(media_count)))

        return {"items": items, "total": int(total)}

    # -- Admin: detail --

    async def get_detail(self, listing_id: UUID) -> dict:
        listing, prop, owner = await self._get_listing_with_owner(listing_id)
        media_rows = (
            await self.session.execute(
                select(Media)
                .where(Media.property_id == prop.id)
                .order_by(Media.ordering)
            )
        ).scalars().all()
        return detail_dict(listing, prop, owner, list(media_rows))

    # -- Admin: approve --

    async def approve(self, listing_id: UUID, admin_user_id: UUID) -> dict:
        ppd_id = await self._resolve_ppd()
        listing, prop, owner = await self._get_listing_with_owner(listing_id)

        if listing.status != ListingStatus.PENDING_REVIEW:
            raise bad_request(
                f"Can only approve pending_review listings "
                f"(current: {listing.status.value})"
            )

        now = datetime.now(UTC)
        listing.status = ListingStatus.ACTIVE
        listing.reviewed_at = now
        # Note: reviewed_by_user_id FKs to tenant users table; platform admin id
        # goes in the audit log only (actor_platform_user_id), not on the listing row.

        # Set expires_at only on first approval
        if listing.expires_at is None:
            listing.expires_at = now + timedelta(days=_EXPIRY_DAYS)

        expires_iso = listing.expires_at.isoformat() if listing.expires_at else None

        await self._audit.record(
            AuditAction.CONSUMER_LISTING_APPROVED,
            tenant_id=ppd_id,
            actor_platform_user_id=admin_user_id,
            entity_type="listing",
            entity_id=listing.id,
            after={
                "status": "active",
                "reviewed_at": now.isoformat(),
                "expires_at": expires_iso,
            },
        )

        await queue_email(
            self.session,
            template_key="consumer_listing_approved",
            recipient_email=owner.email,
            subject=f"Your listing has been approved: {listing.title}",
            body_html=approval_email_html(listing.title, expires_iso),
            payload={"listing_id": str(listing_id)},
        )

        await self.session.flush()
        await self.session.refresh(listing)
        return {"id": str(listing.id), "status": listing.status.value}

    # -- Admin: request changes --

    async def request_changes(
        self, listing_id: UUID, admin_user_id: UUID, notes: str
    ) -> dict:
        ppd_id = await self._resolve_ppd()
        listing, prop, owner = await self._get_listing_with_owner(listing_id)

        if listing.status != ListingStatus.PENDING_REVIEW:
            raise bad_request(
                f"Can only request changes on pending_review listings "
                f"(current: {listing.status.value})"
            )

        now = datetime.now(UTC)
        listing.status = ListingStatus.CHANGES_REQUESTED
        listing.review_notes = notes
        listing.reviewed_at = now
        # reviewed_by_user_id FKs to tenant users; platform admin tracked via audit only.

        await self._audit.record(
            AuditAction.CONSUMER_LISTING_CHANGES_REQUESTED,
            tenant_id=ppd_id,
            actor_platform_user_id=admin_user_id,
            entity_type="listing",
            entity_id=listing.id,
            after={
                "status": "changes_requested",
                "reviewed_at": now.isoformat(),
                "notes": notes,
            },
        )

        await queue_email(
            self.session,
            template_key="consumer_listing_changes_requested",
            recipient_email=owner.email,
            subject=f"Changes requested on your listing: {listing.title}",
            body_html=changes_email_html(listing.title, notes),
            payload={"listing_id": str(listing_id)},
        )

        await self.session.flush()
        await self.session.refresh(listing)
        return {
            "id": str(listing.id),
            "status": listing.status.value,
            "review_notes": notes,
        }
