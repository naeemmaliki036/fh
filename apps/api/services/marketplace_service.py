"""Marketplace service — facade over marketplace_queries.

Handles: cross-tenant listing search, agency list/detail, stats, featured.
All reads are public; no tenant_id scoping from auth.
"""

from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AgentStatus, ListingStatus, TenantStatus
from apps.api.models.agent import Agent
from apps.api.models.listing import Listing
from apps.api.models.tenant import Tenant
from apps.api.services.base import BaseService
from apps.api.services.marketplace_agent_queries import fetch_marketplace_agents
from apps.api.services.marketplace_queries import (
    _marketplace_tenant_filter,
    _tenant_snippet,
    fetch_marketplace_listings,
)
from apps.api.services.public_site_detail_queries import fetch_listing_detail
from packages.common.utils.error_handlers import not_found


class MarketplaceService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    # ------------------------------------------------------------------
    # Listings
    # ------------------------------------------------------------------

    async def list_listings(self, **kwargs) -> dict:  # noqa: ANN003
        return await fetch_marketplace_listings(self.session, **kwargs)

    # ------------------------------------------------------------------
    # Agents
    # ------------------------------------------------------------------

    async def list_agents(
        self,
        *,
        page: int,
        page_size: int,
        country: str | None = None,
        q: str | None = None,
    ) -> dict:
        """Paginated active agents across qualifying agencies."""
        return await fetch_marketplace_agents(
            self.session,
            page=page,
            page_size=page_size,
            country=country,
            q=q,
        )

    async def get_listing_detail(self, listing_id: UUID) -> dict:
        """Public listing detail with tenant snippet.

        Resolves the listing first, then verifies its tenant qualifies.
        """
        listing = await self.session.get(Listing, listing_id)
        if not listing or listing.status not in {
            ListingStatus.ACTIVE,
            ListingStatus.APPROVED,
            ListingStatus.PAUSED,
        }:
            raise not_found("Listing")

        tenant = await self.session.get(Tenant, listing.tenant_id)
        if not tenant:
            raise not_found("Listing")
        if (
            tenant.status != TenantStatus.ACTIVE
            or not tenant.aggregator_enabled
            or not tenant.public_site_enabled
        ):
            raise not_found("Listing")

        # Reuse the existing detail query; it scopes by tenant.
        detail = await fetch_listing_detail(self.session, tenant, listing_id)

        # Replace flat tenant_* keys with the structured snippet.
        detail.pop("tenant_name", None)
        detail.pop("tenant_logo_url", None)
        detail.pop("tenant_tagline", None)
        detail.pop("tenant_contact_email", None)
        detail.pop("tenant_contact_phone", None)
        detail["tenant"] = _tenant_snippet(tenant)

        # Consumer listing enrichment (migration 0044)
        is_consumer = detail.pop("_is_consumer_listing", False)
        consumer_account_id = detail.pop("_consumer_account_id", None)
        detail["is_consumer_listing"] = is_consumer
        if is_consumer and consumer_account_id:
            from apps.api.models.consumer_account import ConsumerAccount
            ca = await self.session.get(ConsumerAccount, consumer_account_id)
            detail["owner_display_name"] = ca.full_name if ca else None
        else:
            detail["owner_display_name"] = tenant.name

        return detail

    # ------------------------------------------------------------------
    # Agencies
    # ------------------------------------------------------------------

    async def list_agencies(
        self, *, page: int, page_size: int, country: str | None = None
    ) -> dict:
        """Paginated list of qualifying agencies, sorted by active listings count.

        country: ISO-3166 alpha-2; filters tenants whose operating_countries array
        contains this code.
        """
        listing_count_sq = (
            select(Listing.tenant_id, func.count(Listing.id).label("cnt"))
            .where(Listing.status == ListingStatus.ACTIVE)
            .group_by(Listing.tenant_id)
            .subquery("lc")
        )
        agent_count_sq = (
            select(Agent.tenant_id, func.count(Agent.id).label("cnt"))
            .where(Agent.status == AgentStatus.ACTIVE)
            .group_by(Agent.tenant_id)
            .subquery("ac")
        )

        base = (
            select(
                Tenant,
                func.coalesce(listing_count_sq.c.cnt, 0).label("listings_count"),
                func.coalesce(agent_count_sq.c.cnt, 0).label("agents_count"),
            )
            .outerjoin(listing_count_sq, listing_count_sq.c.tenant_id == Tenant.id)
            .outerjoin(agent_count_sq, agent_count_sq.c.tenant_id == Tenant.id)
        )
        base = _marketplace_tenant_filter(base)
        if country:
            base = base.where(Tenant.operating_countries.any(country.upper()))

        total = (await self.session.execute(
            select(func.count()).select_from(base.subquery())
        )).scalar_one()

        rows = (
            await self.session.execute(
                base
                .order_by(text("listings_count DESC"))
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()

        items = [
            {
                "id": t.id, "slug": t.slug, "name": t.name,
                "logo_url": t.public_site_logo_url,
                "banner_url": t.banner_url,
                "tagline": t.public_site_tagline,
                "contact_phone": t.contact_phone,
                "contact_email": t.contact_email,
                "operating_countries": t.operating_countries or [],
                "listings_count": int(lc),
                "agents_count": int(ac),
            }
            for t, lc, ac in rows
        ]
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    async def get_agency(self, slug: str) -> dict:
        """Single qualifying agency by slug. 404 if not found or disqualified."""
        stmt = select(Tenant).where(Tenant.slug == slug)
        tenant = (await self.session.execute(stmt)).scalar_one_or_none()
        if not tenant:
            raise not_found("Agency")
        if (
            tenant.status != TenantStatus.ACTIVE
            or not tenant.aggregator_enabled
            or not tenant.public_site_enabled
        ):
            raise not_found("Agency")

        listings_count = (await self.session.execute(
            select(func.count(Listing.id)).where(
                Listing.tenant_id == tenant.id,
                Listing.status == ListingStatus.ACTIVE,
            )
        )).scalar_one()
        agents_count = (await self.session.execute(
            select(func.count(Agent.id)).where(
                Agent.tenant_id == tenant.id,
                Agent.status == AgentStatus.ACTIVE,
            )
        )).scalar_one()

        return {
            "id": tenant.id, "slug": tenant.slug, "name": tenant.name,
            "logo_url": tenant.public_site_logo_url,
            "banner_url": tenant.banner_url,
            "tagline": tenant.public_site_tagline,
            "contact_phone": tenant.contact_phone,
            "contact_email": tenant.contact_email,
            "operating_countries": tenant.operating_countries or [],
            "listings_count": int(listings_count),
            "agents_count": int(agents_count),
            "description": None,  # Phase 2: dedicated description field
        }

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    async def get_stats(self, *, country: str | None = None) -> dict:
        """Cross-tenant stats: total listings, total agencies, by_type breakdown.

        When country is supplied, both totals are filtered: tenants with that ISO
        code in operating_countries and properties whose country column matches.
        """
        c_norm = country.upper() if country else None

        # Total qualifying tenants
        agency_stmt = _marketplace_tenant_filter(select(func.count(Tenant.id)))
        if c_norm:
            agency_stmt = agency_stmt.where(Tenant.operating_countries.any(c_norm))
        total_agencies = (await self.session.execute(agency_stmt)).scalar_one()

        # Listing counts — must join Tenant to apply qualifying filter.
        sql = (
            "SELECT p.property_type, COUNT(l.id) AS cnt "
            "FROM listings l "
            "JOIN properties p ON p.id = l.property_id "
            "JOIN tenants t ON t.id = l.tenant_id "
            "WHERE l.status = 'active' "
            "  AND t.status = 'active' "
            "  AND t.aggregator_enabled = true "
            "  AND t.public_site_enabled = true "
        )
        params: dict[str, str] = {}
        if c_norm:
            sql += "  AND p.country = :country "
            params["country"] = c_norm
        sql += "GROUP BY p.property_type ORDER BY cnt DESC"
        rows = (await self.session.execute(text(sql), params)).all()

        total_listings = sum(int(r.cnt) for r in rows)
        by_type = [{"property_type": r.property_type, "count": int(r.cnt)} for r in rows]
        return {
            "total_listings": total_listings,
            "total_agencies": int(total_agencies),
            "by_type": by_type,
        }

    # ------------------------------------------------------------------
    # Countries
    # ------------------------------------------------------------------

    async def list_countries(self) -> dict:
        """Return enabled marketplace countries ordered by display_order, code.

        Data comes from the platform-managed marketplace_countries catalog
        (migration 0043), not from tenant.operating_countries.
        Returns: { "countries": [{ "code": "AE", "name": ..., "flag_emoji": ...,
                                    "display_order": 10 }, ...] }
        """
        from apps.api.services.marketplace_country_service import (
            MarketplaceCountryService,
        )

        rows = await MarketplaceCountryService(self.session).list_enabled()
        return {
            "countries": [
                {
                    "code": mc.code,
                    "name": mc.name,
                    "flag_emoji": mc.flag_emoji,
                    "display_order": mc.display_order,
                    "hero_image_url": mc.hero_image_url,
                }
                for mc in rows
            ]
        }

    # ------------------------------------------------------------------
    # Featured (homepage hero)
    # ------------------------------------------------------------------

    async def get_featured(self, *, country: str | None = None) -> dict:
        """Up to 12 featured listings: verified first, then premium tier, then newest."""
        return await fetch_marketplace_listings(
            self.session,
            page=1,
            page_size=12,
            sort="verified_first",
            country=country,
        )
