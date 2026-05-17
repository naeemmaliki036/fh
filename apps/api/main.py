"""fh Real Estate SaaS — FastAPI application entry point."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from apps.api.config import settings
from apps.api.middleware.logging import LoggingMiddleware
from apps.api.middleware.security_headers import SecurityHeadersMiddleware
from apps.api.middleware.tenant_suspension import TenantSuspensionMiddleware
from apps.api.routers import (
    admin_locations,
    agents,
    audit_logs,
    auth,
    customers,
    deals,
    document_requests,
    email_outbox,
    email_templates,
    leaderboard,
    leads,
    listing_document_routes,
    listing_interests,
    listing_price_routes,
    listing_review_routes,
    listings,
    locations,
    marketplace_countries_admin,
    marketing,
    media,
    notifications,
    off_market_reasons,
    open_houses,
    platform_users,
    price_validation_admin,
    private_documents,
    properties,
    reports,
    tenants,
    users,
)
from apps.api.routers.public import document_requests as public_document_requests
from apps.api.routers import marketplace, public_site, tenant_public_site
from apps.api.routers import (
    admin_consumer_listings,
    consumer_auth,
    consumer_favorites,
    consumer_listing_leads,
    consumer_listings,
    tenant_commission_rates,
)

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle."""
    import asyncio

    from apps.api.workers.email_worker import run_forever as run_email_worker

    worker_task = asyncio.create_task(run_email_worker())
    try:
        yield
    finally:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="fh Real Estate Platform API",
    version="0.1.0",
    description="Multi-tenant real estate SaaS — Phase 1",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware (last-added runs first)
# ---------------------------------------------------------------------------
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(TenantSuspensionMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin", "")
    if origin in settings.cors_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Return CORS headers on HTTP errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_headers(request),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Return CORS headers on unhandled 500 errors."""
    logging.getLogger("fh.api").exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_headers(request),
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(customers.router, prefix="/customers", tags=["customers"])
app.include_router(leads.router, prefix="/leads", tags=["leads"])
app.include_router(deals.router, prefix="/deals", tags=["deals"])
app.include_router(properties.router, prefix="/properties", tags=["properties"])
app.include_router(listings.router, prefix="", tags=["listings"])
app.include_router(listing_price_routes.router, prefix="", tags=["listings"])
app.include_router(listing_document_routes.router, prefix="", tags=["listings"])
# listing_review_routes must be registered BEFORE users.router:
# it exposes GET /users/eligible-reviewers, which would otherwise be swallowed
# by users.router's GET /users/{user_id} parameterised route.
app.include_router(listing_review_routes.router, prefix="", tags=["listings"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(media.router, prefix="", tags=["media"])
app.include_router(document_requests.router, prefix="/document-requests", tags=["document-requests"])
app.include_router(public_document_requests.router, prefix="/public/document-requests", tags=["public"])
app.include_router(public_site.router, prefix="/public/sites", tags=["public"])
app.include_router(tenant_public_site.router, prefix="/tenants/me/public-site", tags=["tenants"])
app.include_router(notifications.router, prefix="/platform/notifications", tags=["notifications"])
app.include_router(platform_users.router, prefix="/platform/users", tags=["platform"])
app.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit-logs"])
app.include_router(marketing.router, prefix="/marketing", tags=["marketing"])
app.include_router(email_templates.router, prefix="/admin/email-templates", tags=["email-templates"])
app.include_router(email_outbox.router, prefix="/admin/email-outbox", tags=["email-outbox"])
app.include_router(off_market_reasons.router, prefix="/off-market-reasons", tags=["off-market-reasons"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
app.include_router(locations.router, prefix="/locations", tags=["locations"])
app.include_router(admin_locations.router, prefix="/admin/locations", tags=["admin-locations"])
# Customer detail feature (migration 0037)
# listing_interests must come BEFORE listings prefix="" catch-all
app.include_router(listing_interests.router, prefix="", tags=["listings"])
app.include_router(private_documents.router, prefix="/private-documents", tags=["private-documents"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(open_houses.router, prefix="", tags=["open-houses"])
app.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])
app.include_router(
    marketplace_countries_admin.router,
    prefix="/admin/marketplace-countries",
    tags=["admin-marketplace-countries"],
)
app.include_router(
    price_validation_admin.router,
    prefix="/admin/price-validation-rules",
    tags=["admin-price-validation"],
)
# Consumer (marketplace end-user) routes
app.include_router(consumer_auth.router, prefix="/consumer", tags=["consumer-auth"])
app.include_router(consumer_listings.router, prefix="/consumer", tags=["consumer-listings"])
app.include_router(consumer_favorites.router, prefix="/consumer", tags=["consumer-favorites"])
app.include_router(
    consumer_listing_leads.router,
    prefix="/public",
    tags=["consumer-listing-leads"],
)
app.include_router(
    admin_consumer_listings.router,
    prefix="/platform-admin/consumer-listings",
    tags=["admin-consumer-listings"],
)
app.include_router(
    tenant_commission_rates.router,
    prefix="/tenant/commission-rates",
    tags=["tenant-commission-rates"],
)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Local dev static mounts — public uploads only (never private)
# ---------------------------------------------------------------------------
if not settings.cf_r2_bucket:
    _pub_dir = Path(settings.local_uploads_root) / "public"
    _pub_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/_local-public", StaticFiles(directory=str(_pub_dir)), name="local-public")
