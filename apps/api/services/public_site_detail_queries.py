"""Public site — listing detail query helper.

Extracted from public_site_queries.py to stay within the 300-LOC cap.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import ListingStatus, MediaKind
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.open_house import OpenHouse
from apps.api.models.open_house_enums import OpenHouseStatus
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.public_site_media_helpers import _media_url
from apps.api.services.public_site_queries import get_primary_agent
from packages.common.utils.error_handlers import not_found

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
    """Return full listing detail dict including open houses and floor plans."""
    tid = tenant.id

    listing = await session.get(Listing, listing_id)
    if not listing or listing.tenant_id != tid or listing.status in _HIDDEN_STATUSES:
        raise not_found("Listing")

    prop = await session.get(Property, listing.property_id)
    if not prop or prop.tenant_id != tid:
        raise not_found("Listing")

    all_image_rows = (
        await session.execute(
            select(Media)
            .where(Media.property_id == prop.id, Media.kind == MediaKind.IMAGE)
            .order_by(Media.ordering)
        )
    ).scalars().all()
    floor_plan_urls = [_media_url(m.storage_key) for m in all_image_rows if m.is_floor_plan]
    media_urls = [_media_url(m.storage_key) for m in all_image_rows if not m.is_floor_plan]

    hero_url: str | None = None
    if listing.hero_media_id:
        hero_m = await session.get(Media, listing.hero_media_id)
        if hero_m:
            hero_url = _media_url(hero_m.storage_key)

    agent_data = await get_primary_agent(session, prop.id, tid)

    now = datetime.now(tz=timezone.utc)
    oh_rows = (
        await session.execute(
            select(OpenHouse)
            .where(
                OpenHouse.listing_id == listing_id,
                OpenHouse.tenant_id == tid,
                OpenHouse.status == OpenHouseStatus.SCHEDULED,
                OpenHouse.starts_at >= now,
            )
            .order_by(OpenHouse.starts_at.asc())
            .limit(5)
        )
    ).scalars().all()

    next_open_house: dict | None = None
    upcoming_open_houses: list[dict] = []
    for oh in oh_rows:
        entry = {
            "starts_at": oh.starts_at.isoformat(),
            "ends_at": oh.ends_at.isoformat(),
            "capacity": oh.capacity,
        }
        if next_open_house is None:
            next_open_house = {
                "starts_at": oh.starts_at.isoformat(),
                "ends_at": oh.ends_at.isoformat(),
            }
        upcoming_open_houses.append(entry)

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
        "area": prop.area,
        "city": prop.city,
        "internal_reference": prop.internal_reference,
        "build_year": prop.build_year,
        "property_type": prop.property_type.value,
        "amenities": prop.amenities or [],
        "tags": prop.tags or [],
        "media_urls": media_urls,
        "floor_plan_urls": floor_plan_urls,
        "hero_media_url": hero_url,
        "agent": agent_data,
        "next_open_house": next_open_house,
        "upcoming_open_houses": upcoming_open_houses,
        # Off-plan delivery info.
        "handover_year": prop.handover_year,
        "handover_quarter": prop.handover_quarter,
        "payment_plan": bool(prop.payment_plan),
        "tenant_name": tenant.name,
        "tenant_logo_url": tenant.public_site_logo_url,
        "tenant_tagline": tenant.public_site_tagline,
        "tenant_contact_email": tenant.contact_email,
        "tenant_contact_phone": tenant.contact_phone,
    }
