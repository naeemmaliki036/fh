"""Listing verification + detail enrichment service (migration 0040).

Extracted from listing_service.py to respect the 300 LOC cap.

verify_listing / unverify_listing mutate the Listing row and write audit rows.
enrich_listing_detail computes derived metrics (price_per_sqft, price_drop_pct,
days_since_posted, verified_by_user_name) that are NOT DB columns.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole
from apps.api.models.listing import Listing
from apps.api.models.listing_price_history import ListingPriceHistory
from apps.api.models.property import Property
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.listing_service import ListingService
from packages.common.utils.error_handlers import bad_request, forbidden

_VERIFY_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.LISTING_MANAGER.value,
}


class ListingVerifyService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)
        self._listing_svc = ListingService(session)

    def _require_role(self, role: str) -> None:
        if role not in _VERIFY_ROLES:
            raise forbidden("company_owner, company_admin or listing_manager required")

    async def verify(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        note: str | None = None,
    ) -> Listing:
        self._require_role(current_user["role"])
        listing = await self._listing_svc.get_listing(listing_id, tenant_id)
        if listing.is_verified:
            raise bad_request("Listing is already verified")
        listing.is_verified = True
        listing.verified_at = datetime.now(UTC)
        listing.verified_by_user_id = UUID(current_user["id"])
        await self.session.flush()
        await self._audit.record(
            AuditAction.LISTING_VERIFIED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing",
            entity_id=listing.id,
            after={"note": note},
        )
        return await self._listing_svc._refetch(listing_id, tenant_id)

    async def unverify(
        self,
        listing_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        note: str | None = None,
    ) -> Listing:
        self._require_role(current_user["role"])
        listing = await self._listing_svc.get_listing(listing_id, tenant_id)
        if not listing.is_verified:
            raise bad_request("Listing is not verified")
        listing.is_verified = False
        listing.verified_at = None
        listing.verified_by_user_id = None
        await self.session.flush()
        await self._audit.record(
            AuditAction.LISTING_UNVERIFIED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="listing",
            entity_id=listing.id,
            after={"note": note},
        )
        return await self._listing_svc._refetch(listing_id, tenant_id)

    async def compute_enrichments(
        self, listing: Listing
    ) -> dict:
        """Return computed metrics dict to be merged into ListingResponse."""
        prop = await self.session.get(Property, listing.property_id)
        now = datetime.now(UTC)

        # price_per_sqft
        price_per_sqft: int | None = None
        if prop and prop.size_sqft and float(prop.size_sqft) > 0:
            price_per_sqft = round(float(listing.price) / float(prop.size_sqft))

        # price_drop_pct — latest history entry where new_price < old_price
        price_drop_pct: int | None = None
        drop_row = (
            await self.session.execute(
                select(ListingPriceHistory)
                .where(
                    ListingPriceHistory.listing_id == listing.id,
                    ListingPriceHistory.new_price < ListingPriceHistory.old_price,
                )
                .order_by(ListingPriceHistory.changed_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if drop_row:
            old_p = float(drop_row.old_price)
            new_p = float(drop_row.new_price)
            if old_p > 0:
                price_drop_pct = round((old_p - new_p) / old_p * 100)

        # days_since_posted — handle both tz-aware and tz-naive created_at
        ref_dt = listing.created_at
        if ref_dt is not None and ref_dt.tzinfo is None:
            ref_dt = ref_dt.replace(tzinfo=UTC)
        days_since_posted = (now - ref_dt).days if ref_dt else 0

        # verified_by_user_name
        verified_by_user_name: str | None = None
        if listing.verified_by_user_id:
            verifier = await self.session.get(User, listing.verified_by_user_id)
            if verifier:
                verified_by_user_name = verifier.full_name

        # internal_reference from property
        internal_reference: str | None = prop.internal_reference if prop else None

        return {
            "price_per_sqft": price_per_sqft,
            "price_drop_pct": price_drop_pct,
            "days_since_posted": days_since_posted,
            "verified_by_user_name": verified_by_user_name,
            "internal_reference": internal_reference,
        }
