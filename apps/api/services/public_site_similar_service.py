"""Public-site similar listings service (migration 0040).

GET /public/sites/{slug}/listings/{listing_id}/similar?limit=N

Returns up to N active listings from the same tenant that match:
  - same property_type
  - same city
  - price within ±25%
  - exclude the source listing
Sorted by created_at desc.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import ListingStatus, TenantStatus
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.base import BaseService
from apps.api.services.public_site_queries import _media_url, primary_photos_bulk
from packages.common.utils.error_handlers import not_found


class PublicSiteSimilarService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _resolve_tenant(self, slug: str) -> Tenant:
        stmt = select(Tenant).where(Tenant.slug == slug)
        tenant = (await self.session.execute(stmt)).scalar_one_or_none()
        if not tenant or tenant.status != TenantStatus.ACTIVE:
            raise not_found("Public site")
        if not (tenant.public_site_feature_enabled and tenant.public_site_enabled):
            raise not_found("Public site")
        return tenant

    async def get_similar(
        self,
        slug: str,
        listing_id: UUID,
        limit: int = 4,
    ) -> list[dict]:
        """Return similar active listings for a public site listing."""
        tenant = await self._resolve_tenant(slug)
        tid = tenant.id

        # Fetch source listing + its property.
        source = await self.session.get(Listing, listing_id)
        if not source or source.tenant_id != tid or source.status == ListingStatus.ARCHIVED:
            raise not_found("Listing")

        prop = await self.session.get(Property, source.property_id)
        if not prop or prop.tenant_id != tid:
            raise not_found("Listing")

        if not prop.city or float(source.price) <= 0:
            return []

        lo_price = float(source.price) * 0.75
        hi_price = float(source.price) * 1.25

        stmt = (
            select(Listing, Property)
            .join(Property, Listing.property_id == Property.id)
            .where(
                Listing.tenant_id == tid,
                Listing.status == ListingStatus.ACTIVE,
                Listing.id != listing_id,
                Property.property_type == prop.property_type,
                Property.city.ilike(prop.city),
                Listing.price >= lo_price,
                Listing.price <= hi_price,
            )
            .order_by(Listing.created_at.desc())
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()

        prop_ids = [p.id for _, p in rows]
        photo_map = await primary_photos_bulk(self.session, prop_ids)

        items = []
        for listing, similar_prop in rows:
            hero_url: str | None = None
            if listing.hero_media_id:
                from apps.api.models.media import Media
                hero_m = await self.session.get(Media, listing.hero_media_id)
                if hero_m:
                    hero_url = _media_url(hero_m.storage_key)
            items.append({
                "id": listing.id,
                "title": listing.title,
                "short_description": listing.short_description,
                "price": float(listing.price),
                "currency": listing.currency,
                "beds": similar_prop.bedrooms,
                "baths": similar_prop.bathrooms,
                "area_sqft": float(similar_prop.size_sqft) if similar_prop.size_sqft else None,
                "address": similar_prop.address_line,
                "property_type": similar_prop.property_type.value,
                "primary_photo_url": hero_url or photo_map.get(similar_prop.id),
                "purpose": listing.purpose.value,
                "tags": similar_prop.tags or [],
            })
        return items
