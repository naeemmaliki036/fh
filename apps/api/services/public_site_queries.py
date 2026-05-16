"""Public site — read-only query helpers used by PublicSiteService.

Extracted to keep public_site_service.py under the 300 LOC cap.
All functions receive an AsyncSession and return plain dicts or None.

fetch_listing_detail  → public_site_detail_queries.py  (split to stay ≤300 LOC)
primary_agents_bulk   → public_site_agent_queries.py   (split to stay ≤300 LOC)
fetch_listing_stats   → public_site_agent_queries.py   (split to stay ≤300 LOC)
_media_url            → public_site_media_helpers.py   (shared utility)

All of the above are re-exported here so existing callers don't need changing.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import exists, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.enums import ListingStatus, MediaKind
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent
from apps.api.models.tenant import Tenant

# Re-exported so existing callers (public_site_detail_queries.py etc.) work unchanged.
from apps.api.services.public_site_media_helpers import _media_url  # noqa: F401
from apps.api.services.public_site_agent_queries import (  # noqa: F401
    fetch_listing_stats,
    primary_agents_bulk,
)


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
    sort: str = "created_at_desc",
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
        stmt = stmt.where(Property.amenities.contains(amenities))
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
    # migration 0040 filters
    if is_verified is not None:
        stmt = stmt.where(Listing.is_verified.is_(is_verified))
    if rent_cheque_count is not None:
        stmt = stmt.where(Listing.rent_cheque_count == rent_cheque_count)
    if min_build_year is not None:
        stmt = stmt.where(Property.build_year >= min_build_year)
    if max_build_year is not None:
        stmt = stmt.where(Property.build_year <= max_build_year)
    if has_floor_plan is True:
        stmt = stmt.where(
            exists(select(Media.id).where(
                Media.property_id == Property.id,
                Media.is_floor_plan.is_(True),
            ))
        )
    elif has_floor_plan is False:
        stmt = stmt.where(
            ~exists(select(Media.id).where(
                Media.property_id == Property.id,
                Media.is_floor_plan.is_(True),
            ))
        )

    count_q = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_q)).scalar_one()

    if sort == "verified_first":
        order_clause = [Listing.is_verified.desc(), Listing.created_at.desc()]
    elif sort == "price_asc":
        order_clause = [Listing.price.asc()]
    elif sort == "price_desc":
        order_clause = [Listing.price.desc()]
    else:  # created_at_desc (default)
        order_clause = [Listing.created_at.desc()]

    rows = (
        await session.execute(
            stmt.order_by(*order_clause)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    prop_ids = [prop.id for _, prop in rows]
    photo_map = await primary_photos_bulk(session, prop_ids)
    agent_map = await primary_agents_bulk(session, prop_ids)

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

    # Single query for next upcoming open house per listing (no N+1).
    listing_ids = [listing.id for listing, _ in rows]
    next_open_house_map: dict[UUID, datetime] = {}
    if listing_ids:
        id_list = ", ".join(f"'{lid}'" for lid in listing_ids)
        now_iso = datetime.now(tz=timezone.utc).isoformat()
        oh_rows = (
            await session.execute(
                text(
                    f"SELECT DISTINCT ON (listing_id) listing_id, starts_at "
                    f"FROM open_houses "
                    f"WHERE listing_id IN ({id_list}) "
                    f"  AND status = 'scheduled' "
                    f"  AND starts_at >= '{now_iso}' "
                    f"ORDER BY listing_id, starts_at ASC"
                )
            )
        ).all()
        next_open_house_map = {row.listing_id: row.starts_at for row in oh_rows}

    items = []
    for listing, prop in rows:
        hero_url = hero_keys.get(listing.hero_media_id) if listing.hero_media_id else None
        price = float(listing.price)
        size = float(prop.size_sqft) if prop.size_sqft else None
        next_oh = next_open_house_map.get(listing.id)
        agent_info = agent_map.get(prop.id, {})
        items.append({
            "id": listing.id,
            "title": listing.title,
            "short_description": listing.short_description,
            "price": price,
            "currency": listing.currency,
            "beds": prop.bedrooms,
            "baths": prop.bathrooms,
            "area_sqft": size,
            "address": prop.address_line,
            "area": prop.area,
            "city": prop.city,
            "property_type": prop.property_type.value,
            "primary_photo_url": hero_url or photo_map.get(prop.id),
            "purpose": listing.purpose.value,
            "tags": prop.tags or [],
            "created_at": listing.created_at.isoformat() if listing.created_at else None,
            "is_verified": bool(listing.is_verified),
            "internal_reference": prop.internal_reference,
            "price_per_sqft": round(price / size) if size and size > 0 else None,
            "build_year": prop.build_year,
            "listing_tier": listing.listing_tier.value if listing.listing_tier else None,
            "next_open_house_at": next_oh.isoformat() if next_oh else None,
            # Agent card fields (bulk-fetched above — no N+1).
            "agent_name": agent_info.get("agent_name"),
            "agent_phone": agent_info.get("agent_phone"),
            "agent_photo_url": agent_info.get("agent_photo_url"),
            "agent_has_license": agent_info.get("agent_has_license", False),
        })
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# Re-export so existing callers (public_site_service.py) work unchanged.
from apps.api.services.public_site_detail_queries import fetch_listing_detail  # noqa: F401, E402
