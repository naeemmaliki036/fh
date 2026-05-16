"""Marketplace — raw SQLAlchemy / SQL query helpers.

All queries scope to: status='active' AND aggregator_enabled=true
AND public_site_enabled=true (the qualifying-tenant filter).

Uses the partial index idx_tenants_marketplace_visible from migration 0042.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import ListingStatus
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.services.public_site_agent_queries import primary_agents_bulk
from apps.api.services.public_site_media_helpers import _media_url
from apps.api.services.public_site_queries import primary_photos_bulk


# ---------------------------------------------------------------------------
# Shared tenant filter helper
# ---------------------------------------------------------------------------


def _marketplace_tenant_filter(stmt):
    """Append the 3-gate qualifying-tenant WHERE clauses to any statement."""
    from apps.api.models.enums import TenantStatus
    return stmt.where(
        Tenant.status == TenantStatus.ACTIVE,
        Tenant.aggregator_enabled.is_(True),
        Tenant.public_site_enabled.is_(True),
    )


# ---------------------------------------------------------------------------
# Hero key bulk fetch (internal helper)
# ---------------------------------------------------------------------------


async def _hero_keys_bulk(
    session: AsyncSession, rows: list
) -> dict[UUID, str]:
    hero_ids = [listing.hero_media_id for listing, _, _ in rows if listing.hero_media_id]
    if not hero_ids:
        return {}
    id_list = ", ".join(f"'{mid}'" for mid in hero_ids)
    hero_rows = (
        await session.execute(
            text(f"SELECT id, storage_key FROM media WHERE id IN ({id_list})")
        )
    ).all()
    return {row.id: _media_url(row.storage_key) for row in hero_rows}


# ---------------------------------------------------------------------------
# Next open house bulk fetch
# ---------------------------------------------------------------------------


async def _next_open_houses_bulk(
    session: AsyncSession, listing_ids: list[UUID]
) -> dict[UUID, datetime]:
    if not listing_ids:
        return {}
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
    return {row.listing_id: row.starts_at for row in oh_rows}


# ---------------------------------------------------------------------------
# Tenant snippet builder
# ---------------------------------------------------------------------------


def _tenant_snippet(tenant: Tenant) -> dict:
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "name": tenant.name,
        "logo_url": tenant.public_site_logo_url,
        "banner_url": tenant.banner_url,
        "tagline": tenant.public_site_tagline,
        "contact_phone": tenant.contact_phone,
        "contact_email": tenant.contact_email,
    }


# ---------------------------------------------------------------------------
# Build a listing item dict from a (Listing, Property, Tenant) row
# ---------------------------------------------------------------------------


def _listing_row_to_dict(
    listing: Listing,
    prop: Property,
    tenant: Tenant,
    *,
    hero_keys: dict,
    photo_map: dict,
    agent_map: dict,
    next_open_house_map: dict,
) -> dict:
    hero_url = hero_keys.get(listing.hero_media_id) if listing.hero_media_id else None
    price = float(listing.price)
    size = float(prop.size_sqft) if prop.size_sqft else None
    agent_info = agent_map.get(prop.id, {})
    next_oh = next_open_house_map.get(listing.id)
    return {
        "id": listing.id,
        "title": listing.title,
        "short_description": listing.short_description,
        "price": price,
        "currency": listing.currency,
        "beds": prop.bedrooms,
        "baths": prop.bathrooms,
        "area_sqft": size,
        "area": prop.area,
        "city": prop.city,
        "property_type": prop.property_type.value,
        "primary_photo_url": hero_url or photo_map.get(prop.id),
        "purpose": listing.purpose.value,
        "listing_tier": listing.listing_tier.value if listing.listing_tier else None,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "is_verified": bool(listing.is_verified),
        "price_per_sqft": round(price / size) if size and size > 0 else None,
        "price_drop_pct": None,  # Phase 2 — listing_price_history
        "internal_reference": prop.internal_reference,
        "build_year": prop.build_year,
        "agent_name": agent_info.get("agent_name"),
        "agent_phone": agent_info.get("agent_phone"),
        "agent_photo_url": agent_info.get("agent_photo_url"),
        "agent_has_license": agent_info.get("agent_has_license", False),
        "next_open_house_at": next_oh.isoformat() if next_oh else None,
        "tenant": _tenant_snippet(tenant),
    }


# ---------------------------------------------------------------------------
# Core paginated listing query
# ---------------------------------------------------------------------------


async def fetch_marketplace_listings(  # noqa: PLR0913
    session: AsyncSession,
    *,
    page: int,
    page_size: int,
    sort: str = "verified_first",
    purpose: str | None = None,
    property_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    beds: int | None = None,
    baths: int | None = None,
    city: str | None = None,
    area: str | None = None,
    amenities: list[str] | None = None,
    furnishing_status: str | None = None,
    completion_status: str | None = None,
    view_orientation: str | None = None,
    is_verified: bool | None = None,
    rent_cheque_count: int | None = None,
    min_build_year: int | None = None,
    max_build_year: int | None = None,
    has_floor_plan: bool | None = None,
    q: str | None = None,
    tenant_id: UUID | None = None,
    country: str | None = None,
) -> dict:
    stmt = (
        select(Listing, Property, Tenant)
        .join(Property, Listing.property_id == Property.id)
        .join(Tenant, Listing.tenant_id == Tenant.id)
        .where(Listing.status == ListingStatus.ACTIVE)
    )
    stmt = _marketplace_tenant_filter(stmt)

    if country is not None:
        stmt = stmt.where(Property.country == country.upper())
    if tenant_id is not None:
        stmt = stmt.where(Tenant.id == tenant_id)
    if purpose is not None:
        stmt = stmt.where(Listing.purpose == purpose)
    if property_type is not None:
        stmt = stmt.where(Property.property_type == property_type)
    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if beds is not None:
        stmt = stmt.where(Property.bedrooms == beds)
    if baths is not None:
        stmt = stmt.where(Property.bathrooms == baths)
    if city is not None:
        stmt = stmt.where(Property.city.ilike(f"%{city}%"))
    if area is not None:
        stmt = stmt.where(Property.area.ilike(f"%{area}%"))
    if amenities:
        stmt = stmt.where(Property.amenities.contains(amenities))
    if furnishing_status:
        stmt = stmt.where(Property.furnishing_status == furnishing_status)
    if completion_status:
        stmt = stmt.where(Property.completion_status == completion_status)
    if view_orientation:
        stmt = stmt.where(Property.view_orientation == view_orientation)
    if is_verified is not None:
        stmt = stmt.where(Listing.is_verified.is_(is_verified))
    if rent_cheque_count is not None:
        stmt = stmt.where(Listing.rent_cheque_count == rent_cheque_count)
    if min_build_year is not None:
        stmt = stmt.where(Property.build_year >= min_build_year)
    if max_build_year is not None:
        stmt = stmt.where(Property.build_year <= max_build_year)
    if has_floor_plan is True:
        from sqlalchemy import exists
        from apps.api.models.media import Media
        stmt = stmt.where(
            exists(select(Media.id).where(
                Media.property_id == Property.id,
                Media.is_floor_plan.is_(True),
            ))
        )
    elif has_floor_plan is False:
        from sqlalchemy import exists
        from apps.api.models.media import Media
        stmt = stmt.where(
            ~exists(select(Media.id).where(
                Media.property_id == Property.id,
                Media.is_floor_plan.is_(True),
            ))
        )
    if q is not None:
        term = f"%{q}%"
        stmt = stmt.where(
            Listing.title.ilike(term) | Listing.description.ilike(term)
        )

    total = (await session.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar_one()

    if sort == "verified_first":
        order_clause = [Listing.is_verified.desc(), Listing.created_at.desc()]
    elif sort == "price_asc":
        order_clause = [Listing.price.asc()]
    elif sort == "price_desc":
        order_clause = [Listing.price.desc()]
    else:  # created_at_desc
        order_clause = [Listing.created_at.desc()]

    rows = (
        await session.execute(
            stmt.order_by(*order_clause)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    prop_ids = [prop.id for _, prop, _ in rows]
    photo_map = await primary_photos_bulk(session, prop_ids)
    agent_map = await primary_agents_bulk(session, prop_ids)
    hero_keys = await _hero_keys_bulk(session, rows)
    listing_ids = [listing.id for listing, _, _ in rows]
    oh_map = await _next_open_houses_bulk(session, listing_ids)

    items = [
        _listing_row_to_dict(
            listing, prop, tenant,
            hero_keys=hero_keys, photo_map=photo_map,
            agent_map=agent_map, next_open_house_map=oh_map,
        )
        for listing, prop, tenant in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}
