"""Public site service — anonymous, slug-resolved reads + lead capture.

All queries are scoped by the tenant_id resolved from the slug.
No JWT / RLS GUC is set here because these are public reads and the DB owner
role bypasses RLS (same pattern as PublicDocRequestService).
"""

from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.customer import Customer
from apps.api.models.enums import (
    AuditAction,
    CustomerSource,
    LeadStage,
    ListingStatus,
    MediaKind,
    TenantStatus,
)
from apps.api.models.lead import Lead
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent
from apps.api.models.tenant import Tenant
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from apps.api.services.public_site_visibility import resolve_visibility
from fastapi import HTTPException
from packages.common.storage import get_public_storage
from packages.common.utils.error_handlers import not_found


def _media_url(storage_key: str) -> str:
    if storage_key.startswith(("http://", "https://")):
        return storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{storage_key}"
    return f"/_local-public/{storage_key}"


class PublicSiteService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _resolve_tenant(self, slug: str) -> Tenant:
        """Load tenant by slug; 404 if missing/disabled, 410 if suspended."""
        stmt = select(Tenant).where(Tenant.slug == slug)
        tenant = (await self.session.execute(stmt)).scalar_one_or_none()
        if not tenant or not tenant.public_site_enabled:
            raise not_found("Public site")
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
        return tenant

    async def _primary_photos_bulk(self, property_ids: list[UUID]) -> dict[UUID, str]:
        """Return {property_id: url} for the first image of each property in one query."""
        if not property_ids:
            return {}
        id_list = ", ".join(f"'{pid}'" for pid in property_ids)
        rows = (
            await self.session.execute(
                text(
                    f"SELECT DISTINCT ON (property_id) property_id, storage_key "
                    f"FROM media "
                    f"WHERE property_id IN ({id_list}) "
                    f"  AND kind = 'image' "
                    f"ORDER BY property_id, ordering ASC NULLS LAST"
                )
            )
        ).all()
        return {row.property_id: _media_url(row.storage_key) for row in rows}

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
        property_type: str | None,
    ) -> dict:
        tenant = await self._resolve_tenant(slug)
        tid = tenant.id

        stmt = (
            select(Listing, Property)
            .join(Property, Listing.property_id == Property.id)
            .where(
                Listing.tenant_id == tid,
                Listing.status == ListingStatus.ACTIVE,
            )
        )
        if min_price is not None:
            stmt = stmt.where(Listing.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Listing.price <= max_price)
        if beds is not None:
            stmt = stmt.where(Property.bedrooms == beds)
        if property_type is not None:
            stmt = stmt.where(Property.property_type == property_type)

        count_q = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        rows = (
            await self.session.execute(
                stmt.order_by(Listing.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()

        prop_ids = [prop.id for _, prop in rows]
        photo_map = await self._primary_photos_bulk(prop_ids)

        # Fetch hero media URLs in one batch query
        hero_keys: dict[UUID, str] = {}
        hero_ids = [listing.hero_media_id for listing, _ in rows if listing.hero_media_id]
        if hero_ids:
            id_list = ", ".join(f"'{mid}'" for mid in hero_ids)
            hero_rows = (
                await self.session.execute(
                    text(f"SELECT id, storage_key FROM media WHERE id IN ({id_list})")
                )
            ).all()
            hero_keys = {row.id: _media_url(row.storage_key) for row in hero_rows}

        items = []
        for listing, prop in rows:
            hero_url = hero_keys.get(listing.hero_media_id) if listing.hero_media_id else None
            items.append({
                "id": listing.id,
                "title": listing.title,
                "short_description": listing.short_description,
                "price": float(listing.price),
                "currency": listing.currency,
                "beds": prop.bedrooms,
                "baths": prop.bathrooms,
                "area_sqft": float(prop.size_sqft) if prop.size_sqft else None,
                "address": prop.address_line,
                "property_type": prop.property_type.value,
                "primary_photo_url": hero_url or photo_map.get(prop.id),
                "purpose": listing.purpose.value,
                "tags": prop.tags or [],
            })
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    # ------------------------------------------------------------------
    # Endpoint 3: listing detail
    # ------------------------------------------------------------------

    async def get_listing_detail(self, slug: str, listing_id: UUID) -> dict:
        tenant = await self._resolve_tenant(slug)
        tid = tenant.id

        listing = await self.session.get(Listing, listing_id)
        HIDDEN_STATUSES = {
            ListingStatus.ARCHIVED,
            ListingStatus.SOLD,
            ListingStatus.RENTED,
            ListingStatus.OFF_MARKET,
            ListingStatus.EXPIRED,
        }
        if not listing or listing.tenant_id != tid or listing.status in HIDDEN_STATUSES:
            raise not_found("Listing")

        prop = await self.session.get(Property, listing.property_id)
        if not prop or prop.tenant_id != tid:
            raise not_found("Listing")

        media_rows = (
            await self.session.execute(
                select(Media)
                .where(Media.property_id == prop.id, Media.kind == MediaKind.IMAGE)
                .order_by(Media.ordering)
            )
        ).scalars().all()
        media_urls = [_media_url(m.storage_key) for m in media_rows]

        agent_data = await self._get_primary_agent(prop.id, tid)

        # Hero media URL
        hero_url: str | None = None
        if listing.hero_media_id:
            hero_m = await self.session.get(Media, listing.hero_media_id)
            if hero_m:
                hero_url = _media_url(hero_m.storage_key)

        return {
            "id": listing.id,
            "title": listing.title,
            "short_description": listing.short_description,
            "description": listing.description,
            "price": float(listing.price),
            "currency": listing.currency,
            "purpose": listing.purpose.value,
            "status": listing.status.value,
            "beds": prop.bedrooms,
            "baths": prop.bathrooms,
            "area_sqft": float(prop.size_sqft) if prop.size_sqft else None,
            "address": prop.address_line,
            "property_type": prop.property_type.value,
            "amenities": prop.amenities or [],
            "tags": prop.tags or [],
            "media_urls": media_urls,
            "hero_media_url": hero_url,
            "agent": agent_data,
        }

    async def _get_primary_agent(self, property_id: UUID, tenant_id: UUID) -> dict | None:
        stmt = (
            select(Agent)
            .join(PropertyAgent, PropertyAgent.agent_id == Agent.id)
            .where(
                PropertyAgent.property_id == property_id,
                PropertyAgent.tenant_id == tenant_id,
                PropertyAgent.is_primary.is_(True),
            )
            .limit(1)
        )
        agent = (await self.session.execute(stmt)).scalar_one_or_none()
        if not agent:
            return None
        return {
            "id": agent.id,
            "full_name": agent.full_name,
            "photo_url": _media_url(agent.photo_key) if agent.photo_key else None,
            "phone": agent.phone,
            "email": agent.email,
        }

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

        listing_obj = None
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
