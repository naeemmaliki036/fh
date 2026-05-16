"""Public site service — anonymous, slug-resolved reads + lead capture.

All queries are scoped by the tenant_id resolved from the slug.
No JWT / RLS GUC is set here because these are public reads and the DB owner
role bypasses RLS (same pattern as PublicDocRequestService).

Heavy read logic (listing list, listing detail, primary-photos bulk) lives in
public_site_queries.py to keep this file under 300 LOC.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.customer import Customer
from apps.api.models.enums import (
    AuditAction,
    CustomerSource,
    LeadStage,
    ListingStatus,
    TenantStatus,
)
from apps.api.models.lead import Lead
from apps.api.models.listing import Listing
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.public_site_queries import fetch_listing_detail, fetch_listing_list
from apps.api.services.public_site_visibility import resolve_visibility
from fastapi import HTTPException
from packages.common.utils.error_handlers import not_found


class PublicSiteService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _resolve_tenant(
        self,
        slug: str,
        require: str = "public",
    ) -> Tenant:
        """Load tenant by slug; enforce visibility + suspension.

        Args:
            slug:    The tenant's public slug.
            require: "public" (default) — 404 unless visibility == "public".
                     "any" — 404 only when visibility == "disabled"; allows
                     "direct_only" through (used for listing-detail endpoint).
        """
        stmt = select(Tenant).where(Tenant.slug == slug)
        tenant = (await self.session.execute(stmt)).scalar_one_or_none()
        if not tenant:
            raise not_found("Public site")

        # Suspension wins over all visibility states.
        if tenant.status == TenantStatus.SUSPENDED:
            raise HTTPException(
                status_code=410,
                detail={
                    "detail": "site_offline",
                    "reason": tenant.suspended_reason or "This site is temporarily unavailable.",
                },
            )
        if tenant.status != TenantStatus.ACTIVE:
            raise not_found("Public site")

        visibility = resolve_visibility(tenant)
        if visibility == "disabled":
            raise not_found("Public site")
        if require == "public" and visibility != "public":
            raise not_found("Public site")

        return tenant

    # ------------------------------------------------------------------
    # Endpoint 1: tenant public profile
    # ------------------------------------------------------------------

    async def get_profile(self, slug: str) -> Tenant:
        return await self._resolve_tenant(slug)

    # ------------------------------------------------------------------
    # Endpoint 2: paginated active listings
    # ------------------------------------------------------------------

    async def list_listings(
        self,
        slug: str,
        *,
        page: int,
        page_size: int,
        min_price: float | None,
        max_price: float | None,
        beds: int | None,
        baths: int | None = None,
        property_type: str | None,
        amenities: list[str] | None = None,
        furnishing_status: str | None = None,
        completion_status: str | None = None,
        view_orientation: str | None = None,
        city: str | None = None,
        area: str | None = None,
        is_verified: bool | None = None,
        rent_cheque_count: int | None = None,
        min_build_year: int | None = None,
        max_build_year: int | None = None,
        has_floor_plan: bool | None = None,
    ) -> dict:
        tenant = await self._resolve_tenant(slug)
        return await fetch_listing_list(
            self.session, tenant,
            page=page, page_size=page_size,
            min_price=min_price, max_price=max_price,
            beds=beds, baths=baths,
            property_type=property_type,
            amenities=amenities,
            furnishing_status=furnishing_status,
            completion_status=completion_status,
            view_orientation=view_orientation,
            city=city, area=area,
            is_verified=is_verified,
            rent_cheque_count=rent_cheque_count,
            min_build_year=min_build_year,
            max_build_year=max_build_year,
            has_floor_plan=has_floor_plan,
        )

    # ------------------------------------------------------------------
    # Endpoint 3: listing detail
    # ------------------------------------------------------------------

    async def get_listing_detail(self, slug: str, listing_id: UUID) -> dict:
        # require="any" — direct_only mode is allowed for listing detail.
        tenant = await self._resolve_tenant(slug, require="any")
        return await fetch_listing_detail(self.session, tenant, listing_id)

    # ------------------------------------------------------------------
    # Endpoint 4: create lead from contact form
    # ------------------------------------------------------------------

    async def create_lead(
        self,
        slug: str,
        *,
        name: str,
        email: str,
        phone: str | None,
        message: str | None,
        listing_id: UUID | None,
        ip_address: str | None,
    ) -> UUID:
        tenant = await self._resolve_tenant(slug)
        tid = tenant.id

        property_id = None
        if listing_id:
            listing_obj = await self.session.get(Listing, listing_id)
            if (
                not listing_obj
                or listing_obj.tenant_id != tid
                or listing_obj.status != ListingStatus.ACTIVE
            ):
                raise not_found("Listing")
            property_id = listing_obj.property_id

        customer = Customer(
            tenant_id=tid,
            full_name=name,
            email=email,
            phone=phone,
            source=CustomerSource.WEBSITE,
        )
        self.session.add(customer)
        await self.session.flush()

        lead = Lead(
            tenant_id=tid,
            customer_id=customer.id,
            source=CustomerSource.WEBSITE,
            stage=LeadStage.NEW,
            notes=message,
            interest_listing_id=listing_id,
            interest_property_id=property_id,
        )
        self.session.add(lead)
        await self.session.flush()

        await self._audit.record(
            AuditAction.LEAD_CREATED,
            tenant_id=tid,
            entity_type="lead",
            entity_id=lead.id,
            after={"source": "public_site"},
            ip_address=ip_address,
        )

        return lead.id
