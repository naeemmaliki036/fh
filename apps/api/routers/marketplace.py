"""Marketplace router — public, no auth required.

All routes are cross-tenant. Qualifying tenants:
  status=active AND aggregator_enabled=true AND public_site_enabled=true.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from apps.api.dependencies import DbSession
from apps.api.models.enums import CompletionStatus, FurnishingStatus, ViewOrientation
from apps.api.schemas.marketplace import (
    MarketplaceAgencyDetail,
    MarketplaceAgencyListResponse,
    MarketplaceAgentItem,
    MarketplaceAgentsResponse,
    MarketplaceListingDetailResponse,
    MarketplaceListingListResponse,
    MarketplaceStatsResponse,
)
from apps.api.services.marketplace_service import MarketplaceService

router = APIRouter()

_VALID_SORTS = {"verified_first", "created_at_desc", "price_asc", "price_desc"}


def _svc(db: DbSession) -> MarketplaceService:
    return MarketplaceService(db)


def _parse_amenities(amenities: str | None) -> list[str] | None:
    if not amenities:
        return None
    return [a.strip() for a in amenities.split(",") if a.strip()]


# ---------------------------------------------------------------------------
# GET /marketplace/stats
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=MarketplaceStatsResponse)
async def marketplace_stats(
    country: str | None = Query(default=None, max_length=2, description="ISO-3166 alpha-2"),
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceStatsResponse:
    """Cross-tenant counts: total listings, total agencies, by_type breakdown."""
    data = await svc.get_stats(country=country)
    return MarketplaceStatsResponse(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/countries
# ---------------------------------------------------------------------------


@router.get("/countries")
async def marketplace_countries(
    svc: MarketplaceService = Depends(_svc),
) -> dict:
    """Distinct ISO codes where at least one qualifying tenant operates."""
    return await svc.list_countries()


# ---------------------------------------------------------------------------
# GET /marketplace/featured
# ---------------------------------------------------------------------------


@router.get("/featured", response_model=MarketplaceListingListResponse)
async def marketplace_featured(
    country: str | None = Query(default=None, max_length=2),
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceListingListResponse:
    """Up to 12 featured listings for the marketplace homepage hero."""
    data = await svc.get_featured(country=country)
    return MarketplaceListingListResponse(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/listings
# ---------------------------------------------------------------------------


@router.get("/listings", response_model=MarketplaceListingListResponse)
async def marketplace_listings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    sort: str = Query(default="verified_first"),
    purpose: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    beds: int | None = Query(default=None, ge=0),
    min_beds: int | None = Query(default=None, ge=0),
    max_beds: int | None = Query(default=None, ge=0),
    baths: int | None = Query(default=None, ge=0),
    min_baths: int | None = Query(default=None, ge=0),
    max_baths: int | None = Query(default=None, ge=0),
    city: str | None = Query(default=None),
    area: str | None = Query(default=None),
    amenities: str | None = Query(default=None, description="CSV of amenity keys"),
    furnishing_status: FurnishingStatus | None = Query(default=None),
    completion_status: CompletionStatus | None = Query(default=None),
    view_orientation: ViewOrientation | None = Query(default=None),
    is_verified: bool | None = Query(default=None),
    rent_cheque_count: int | None = Query(default=None),
    min_build_year: int | None = Query(default=None),
    max_build_year: int | None = Query(default=None),
    has_floor_plan: bool | None = Query(default=None),
    q: str | None = Query(default=None, description="Free-text search in title/description"),
    country: str | None = Query(default=None, max_length=2, description="ISO-3166 alpha-2"),
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceListingListResponse:
    """Paginated active listings across all qualifying tenants."""
    if sort not in _VALID_SORTS:
        raise HTTPException(
            status_code=422,
            detail=f"sort must be one of: {', '.join(sorted(_VALID_SORTS))}",
        )
    data = await svc.list_listings(
        page=page,
        page_size=page_size,
        sort=sort,
        purpose=purpose,
        property_type=property_type,
        min_price=min_price,
        max_price=max_price,
        beds=beds,
        min_beds=min_beds,
        max_beds=max_beds,
        baths=baths,
        min_baths=min_baths,
        max_baths=max_baths,
        city=city,
        area=area,
        amenities=_parse_amenities(amenities),
        furnishing_status=furnishing_status.value if furnishing_status else None,
        completion_status=completion_status.value if completion_status else None,
        view_orientation=view_orientation.value if view_orientation else None,
        is_verified=is_verified,
        rent_cheque_count=rent_cheque_count,
        min_build_year=min_build_year,
        max_build_year=max_build_year,
        has_floor_plan=has_floor_plan,
        q=q,
        country=country,
    )
    return MarketplaceListingListResponse(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/listings/{listing_id}
# ---------------------------------------------------------------------------


@router.get("/listings/{listing_id}", response_model=MarketplaceListingDetailResponse)
async def marketplace_listing_detail(
    listing_id: UUID,
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceListingDetailResponse:
    """Full listing detail with embedded tenant info. 404 if disqualified."""
    data = await svc.get_listing_detail(listing_id)
    return MarketplaceListingDetailResponse(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/agencies
# ---------------------------------------------------------------------------


@router.get("/agencies", response_model=MarketplaceAgencyListResponse)
async def marketplace_agencies(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    country: str | None = Query(default=None, max_length=2),
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceAgencyListResponse:
    """Paginated qualifying agencies, sorted by active listings count desc."""
    data = await svc.list_agencies(page=page, page_size=page_size, country=country)
    return MarketplaceAgencyListResponse(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/agencies/{slug}
# ---------------------------------------------------------------------------


@router.get("/agencies/{slug}", response_model=MarketplaceAgencyDetail)
async def marketplace_agency_detail(
    slug: str,
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceAgencyDetail:
    """Single agency profile. 404 if slug unknown or disqualified."""
    data = await svc.get_agency(slug)
    return MarketplaceAgencyDetail(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/agencies/{slug}/listings
# ---------------------------------------------------------------------------


@router.get("/agencies/{slug}/listings", response_model=MarketplaceListingListResponse)
async def marketplace_agency_listings(
    slug: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    sort: str = Query(default="verified_first"),
    purpose: str | None = Query(default=None),
    property_type: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    beds: int | None = Query(default=None, ge=0),
    baths: int | None = Query(default=None, ge=0),
    city: str | None = Query(default=None),
    area: str | None = Query(default=None),
    amenities: str | None = Query(default=None),
    is_verified: bool | None = Query(default=None),
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceListingListResponse:
    """Active listings for a single agency. Same filter params as /listings."""
    if sort not in _VALID_SORTS:
        raise HTTPException(
            status_code=422,
            detail=f"sort must be one of: {', '.join(sorted(_VALID_SORTS))}",
        )
    # Resolve agency slug → tenant; 404 if disqualified.
    agency = await svc.get_agency(slug)
    data = await svc.list_listings(
        page=page,
        page_size=page_size,
        sort=sort,
        purpose=purpose,
        property_type=property_type,
        min_price=min_price,
        max_price=max_price,
        beds=beds,
        baths=baths,
        city=city,
        area=area,
        amenities=_parse_amenities(amenities),
        is_verified=is_verified,
        tenant_id=agency["id"],
    )
    return MarketplaceListingListResponse(**data)


# ---------------------------------------------------------------------------
# GET /marketplace/agents
# ---------------------------------------------------------------------------


@router.get("/agents", response_model=MarketplaceAgentsResponse)
async def marketplace_agents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    country: str | None = Query(default=None, max_length=2, description="ISO-3166 alpha-2"),
    q: str | None = Query(default=None, description="Case-insensitive match on agent full_name"),
    svc: MarketplaceService = Depends(_svc),
) -> MarketplaceAgentsResponse:
    """Paginated active agents across all qualifying agencies.

    Sort: most active listings first; ties by license presence (licensed first);
    ties alphabetical by full_name.
    """
    data = await svc.list_agents(
        page=page,
        page_size=page_size,
        country=country,
        q=q,
    )
    return MarketplaceAgentsResponse(**data)
