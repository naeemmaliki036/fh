"""Public site — read-only query helpers used by PublicSiteService.

Extracted to keep public_site_service.py under the 300 LOC cap.
All functions receive an AsyncSession and return plain dicts or None.
"""

from uuid import UUID

import json

from sqlalchemy import cast, func, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.enums import ListingStatus, MediaKind
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent
from apps.api.models.tenant import Tenant
from packages.common.utils.error_handlers import not_found

# Re-exported so callers can do `from public_site_queries import _media_url`.
from packages.common.storage import get_public_storage


def _media_url(storage_key: str) -> str:
    if storage_key.startswith(("http://", "https://")):
        return storage_key
    storage = get_public_storage()
    if storage.public_base_url:
        return f"{storage.public_base_url}/{storage_key}"
    return f"/_local-public/{storage_key}"


async def primary_photos_bulk(session: AsyncSession, property_ids: list[UUID]) -> dict[UUID, str]:
    """Return {property_id: url} for the first image of each property."""
    if not property_ids:
        return {}
    id_list = ", ".join(f"'{pid}'" for pid in property_ids)
    rows = (
        await session.execute(
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


async def get_primary_agent(
    session: AsyncSession, property_id: UUID, tenant_id: UUID
) -> dict | None:
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
    agent = (await session.execute(stmt)).scalar_one_or_none()
    if not agent:
        return None
    return {
        "id": agent.id,
        "full_name": agent.full_name,
        "photo_url": _media_url(agent.photo_key) if agent.photo_key else None,
        "phone": agent.phone,
        "email": agent.email,
    }


async def fetch_listing_list(  # noqa: PLR0913
    session: AsyncSession,
    tenant: Tenant,
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
) -> dict:
    """Return paginated active listings for the tenant."""
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
    if baths is not None:
        stmt = stmt.where(Property.bathrooms == baths)
    if property_type is not None:
        stmt = stmt.where(Property.property_type == property_type)
    if amenities:
        stmt = stmt.where(
            Property.amenities.op("@>")(cast(json.dumps(amenities), JSONB))
        )
    if furnishing_status:
        stmt = stmt.where(Property.furnishing_status == furnishing_status)
    if completion_status:
        stmt = stmt.where(Property.completion_status == completion_status)
    if view_orientation:
        stmt = stmt.where(Property.view_orientation == view_orientation)
    if city:
        stmt = stmt.where(Property.city.ilike(f"%{city}%"))
    if area:
        stmt = stmt.where(Property.area.ilike(f"%{area}%"))

    count_q = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_q)).scalar_one()

    rows = (
        await session.execute(
            stmt.order_by(Listing.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    prop_ids = [prop.id for _, prop in rows]
    photo_map = await primary_photos_bulk(session, prop_ids)

    hero_keys: dict[UUID, str] = {}
    hero_ids = [listing.hero_media_id for listing, _ in rows if listing.hero_media_id]
    if hero_ids:
        id_list = ", ".join(f"'{mid}'" for mid in hero_ids)
        hero_rows = (
            await session.execute(
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


_HIDDEN_STATUSES = frozenset({
    ListingStatus.ARCHIVED,
    ListingStatus.SOLD,
    ListingStatus.RENTED,
    ListingStatus.OFF_MARKET,
    ListingStatus.EXPIRED,
})


async def fetch_listing_detail(
    session: AsyncSession, tenant: Tenant, listing_id: UUID
) -> dict:
    """Return full listing detail with tenant branding fields."""
    tid = tenant.id

    listing = await session.get(Listing, listing_id)
    if not listing or listing.tenant_id != tid or listing.status in _HIDDEN_STATUSES:
        raise not_found("Listing")

    prop = await session.get(Property, listing.property_id)
    if not prop or prop.tenant_id != tid:
        raise not_found("Listing")

    media_rows = (
        await session.execute(
            select(Media)
            .where(Media.property_id == prop.id, Media.kind == MediaKind.IMAGE)
            .order_by(Media.ordering)
        )
    ).scalars().all()
    media_urls = [_media_url(m.storage_key) for m in media_rows]

    hero_url: str | None = None
    if listing.hero_media_id:
        hero_m = await session.get(Media, listing.hero_media_id)
        if hero_m:
            hero_url = _media_url(hero_m.storage_key)

    agent_data = await get_primary_agent(session, prop.id, tid)

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
        # Branding — always present so the listing-detail page renders in
        # direct_only mode without a separate profile call.
        "tenant_name": tenant.name,
        "tenant_logo_url": tenant.public_site_logo_url,
        "tenant_tagline": tenant.public_site_tagline,
        "tenant_contact_email": tenant.contact_email,
        "tenant_contact_phone": tenant.contact_phone,
    }
