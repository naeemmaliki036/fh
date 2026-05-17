"""Marketplace — agent list query.

Extracted from marketplace_service.py to stay within the 300 LOC cap.
All reads are public; no tenant_id scoping from auth.

Qualifying gate: tenants.status='active' AND aggregator_enabled=true
AND public_site_enabled=true AND agents.status='active'.
"""

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.enums import AgentStatus, ListingStatus, TenantStatus
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent
from apps.api.models.tenant import Tenant
from apps.api.services.public_site_media_helpers import _media_url


async def fetch_marketplace_agents(
    session: AsyncSession,
    *,
    page: int,
    page_size: int,
    country: str | None = None,
    q: str | None = None,
) -> dict:
    """Return paginated active agents across qualifying agencies.

    Single query: LEFT JOIN on a per-agent active-listings subquery — no N+1.

    Sort order:
      1. active_listings_count DESC  (most active first)
      2. license_id IS NOT NULL DESC (licensed agents before unlicensed)
      3. full_name ASC               (alphabetical tie-break)
    """
    # ------------------------------------------------------------------
    # Subquery: count properties where this agent is primary AND the
    # property has an active listing on a qualifying tenant.
    # ------------------------------------------------------------------
    active_listing_count_sq = (
        select(
            PropertyAgent.agent_id,
            func.count(Listing.id).label("cnt"),
        )
        .join(Listing, Listing.property_id == PropertyAgent.property_id)
        .join(Tenant, Tenant.id == Listing.tenant_id)
        .where(
            PropertyAgent.is_primary.is_(True),
            Listing.status == ListingStatus.ACTIVE,
            Tenant.status == TenantStatus.ACTIVE,
            Tenant.aggregator_enabled.is_(True),
            Tenant.public_site_enabled.is_(True),
        )
        .group_by(PropertyAgent.agent_id)
        .subquery("alc")
    )

    # ------------------------------------------------------------------
    # Main query: Agent + Tenant (agency) + listings count
    # ------------------------------------------------------------------
    stmt = (
        select(
            Agent,
            Tenant,
            func.coalesce(active_listing_count_sq.c.cnt, 0).label(
                "active_listings_count"
            ),
        )
        .join(Tenant, Tenant.id == Agent.tenant_id)
        .outerjoin(active_listing_count_sq, active_listing_count_sq.c.agent_id == Agent.id)
        .where(
            Agent.status == AgentStatus.ACTIVE,
            Tenant.status == TenantStatus.ACTIVE,
            Tenant.aggregator_enabled.is_(True),
            Tenant.public_site_enabled.is_(True),
        )
    )

    if country:
        stmt = stmt.where(Tenant.operating_countries.any(country.upper()))

    if q:
        stmt = stmt.where(Agent.full_name.ilike(f"%{q}%"))

    # Total count via wrapping subquery
    total = (
        await session.execute(
            select(func.count()).select_from(stmt.subquery())
        )
    ).scalar_one()

    # Ordered result page
    rows = (
        await session.execute(
            stmt.order_by(
                text("active_listings_count DESC"),
                Agent.license_id.is_(None).asc(),   # NOT NULL first → False < True
                Agent.full_name.asc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    items = [
        {
            "id": agent.id,
            "full_name": agent.full_name,
            "phone": agent.phone,
            "email": agent.email,
            "photo_url": _media_url(agent.photo_key) if agent.photo_key else None,
            "license_id": agent.license_id,
            "agency": {
                "id": tenant.id,
                "slug": tenant.slug,
                "name": tenant.name,
                "logo_url": tenant.public_site_logo_url,
            },
            "active_listings_count": int(active_count),
        }
        for agent, tenant, active_count in rows
    ]

    return {"items": items, "total": total, "page": page, "page_size": page_size}
