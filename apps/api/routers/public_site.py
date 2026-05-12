"""Public site router — anonymous, no JWT required.

Pattern mirrors apps/api/routers/public/document_requests.py:
- No CurrentUser / TenantContext dependencies
- DbSession (get_db) only
- Slug resolves to tenant; all downstream queries scoped by that tenant_id
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status

from apps.api.dependencies import DbSession
from apps.api.schemas.public_site import (
    PublicAgentsResponse,
    PublicLeadCreate,
    PublicLeadResponse,
    PublicListingDetailResponse,
    PublicListingListResponse,
    PublicTenantProfileResponse,
    PublicTenantStats,
)
from apps.api.services.public_site_extras_service import PublicSiteExtrasService
from apps.api.services.public_site_service import PublicSiteService
from packages.common.utils.error_handlers import too_many_requests
from packages.common.utils.rate_limit import is_rate_limited

router = APIRouter()

_RATE_MAX = 5
_RATE_WINDOW = 60  # seconds


def _svc(db: DbSession) -> PublicSiteService:
    return PublicSiteService(db)


def _extras_svc(db: DbSession) -> PublicSiteExtrasService:
    return PublicSiteExtrasService(db)


# ---------------------------------------------------------------------------
# Endpoint 1 — GET /public/sites/{slug}
# ---------------------------------------------------------------------------


@router.get("/{slug}", response_model=PublicTenantProfileResponse)
async def get_public_profile(
    slug: str,
    svc: PublicSiteService = Depends(_svc),
    extras: PublicSiteExtrasService = Depends(_extras_svc),
) -> PublicTenantProfileResponse:
    """Return the public tenant profile for a given slug.

    404 if slug not found or public_site_enabled = false.
    """
    tenant = await svc.get_profile(slug)
    stats_data = await extras.get_stats(slug)
    return PublicTenantProfileResponse(
        name=tenant.name,
        logo_url=tenant.public_site_logo_url,
        tagline=tenant.public_site_tagline,
        contact_email=tenant.contact_email,
        contact_phone=tenant.contact_phone,
        stats=PublicTenantStats(**stats_data),
    )


# ---------------------------------------------------------------------------
# Endpoint 2 — GET /public/sites/{slug}/listings
# ---------------------------------------------------------------------------


@router.get("/{slug}/listings", response_model=PublicListingListResponse)
async def list_public_listings(
    slug: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    beds: int | None = Query(default=None, ge=0),
    property_type: str | None = Query(default=None),
    svc: PublicSiteService = Depends(_svc),
) -> PublicListingListResponse:
    """Paginated active listings for a public site.

    404 if slug not found or site disabled.
    """
    data = await svc.list_listings(
        slug,
        page=page,
        page_size=page_size,
        min_price=min_price,
        max_price=max_price,
        beds=beds,
        property_type=property_type,
    )
    return PublicListingListResponse(**data)


# ---------------------------------------------------------------------------
# Endpoint 3 — GET /public/sites/{slug}/listings/{listing_id}
# ---------------------------------------------------------------------------


@router.get("/{slug}/listings/{listing_id}", response_model=PublicListingDetailResponse)
async def get_public_listing_detail(
    slug: str,
    listing_id: UUID,
    svc: PublicSiteService = Depends(_svc),
) -> PublicListingDetailResponse:
    """Full listing detail for a public site.

    404 if slug invalid, site disabled, listing not found, not active,
    or listing belongs to a different tenant (cross-tenant guard).
    """
    data = await svc.get_listing_detail(slug, listing_id)
    return PublicListingDetailResponse(**data)


# ---------------------------------------------------------------------------
# Endpoint 4 — GET /public/sites/{slug}/agents
# ---------------------------------------------------------------------------


@router.get("/{slug}/agents", response_model=PublicAgentsResponse)
async def list_public_agents(
    slug: str,
    extras: PublicSiteExtrasService = Depends(_extras_svc),
) -> PublicAgentsResponse:
    """Up to 12 active agents for the public site, ordered by join date.

    404 if slug not found or site disabled.
    """
    items = await extras.list_agents(slug)
    return PublicAgentsResponse(items=items)


# ---------------------------------------------------------------------------
# Endpoint 5 — POST /public/sites/{slug}/leads
# ---------------------------------------------------------------------------


@router.post("/{slug}/leads", response_model=PublicLeadResponse, status_code=status.HTTP_201_CREATED)
async def create_public_lead(
    slug: str,
    body: PublicLeadCreate,
    request: Request,
    svc: PublicSiteService = Depends(_svc),
) -> PublicLeadResponse:
    """Capture a contact-form lead from the public site.

    Rate-limited: max 5 requests / minute per (IP, slug).
    Returns 201 with lead id only — no internal data leaked.
    """
    ip = request.client.host if request.client else "unknown"
    rate_key = f"{ip}:{slug}"
    if is_rate_limited(rate_key, max_hits=_RATE_MAX, window_seconds=_RATE_WINDOW):
        raise too_many_requests("Too many requests. Please wait and try again.")

    lead_id = await svc.create_lead(
        slug,
        name=body.name,
        email=str(body.email),
        phone=body.phone,
        message=body.message,
        listing_id=body.listing_id,
        ip_address=ip,
    )
    return PublicLeadResponse(id=lead_id)
