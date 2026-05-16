"""Platform-admin CRUD for marketplace_countries.

Mounted at /admin/marketplace-countries.
All routes require OPS_AND_ABOVE (super_admin | operations_admin).
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import DbSession
from apps.api.schemas.marketplace_country import (
    MarketplaceCountryCreateRequest,
    MarketplaceCountryListResponse,
    MarketplaceCountryReorderRequest,
    MarketplaceCountryResponse,
    MarketplaceCountryUpdateRequest,
)
from apps.api.security.platform_roles import OPS_AND_ABOVE, require_platform_role
from apps.api.services.marketplace_country_service import MarketplaceCountryService

router = APIRouter()

_OpsAndAbove = Annotated[dict, Depends(require_platform_role(*OPS_AND_ABOVE))]


def _svc(db: DbSession) -> MarketplaceCountryService:
    return MarketplaceCountryService(db)


# ---------------------------------------------------------------------------
# GET /admin/marketplace-countries
# ---------------------------------------------------------------------------


@router.get("", response_model=MarketplaceCountryListResponse)
async def admin_list_marketplace_countries(
    actor: _OpsAndAbove,
    db: DbSession,
) -> MarketplaceCountryListResponse:
    """List ALL marketplace countries (including disabled), ordered by display_order."""
    items, total = await _svc(db).list_all()
    return MarketplaceCountryListResponse(
        items=[MarketplaceCountryResponse.model_validate(mc) for mc in items],
        total=total,
    )


# ---------------------------------------------------------------------------
# POST /admin/marketplace-countries
# ---------------------------------------------------------------------------


@router.post("", response_model=MarketplaceCountryResponse, status_code=201)
async def admin_create_marketplace_country(
    body: MarketplaceCountryCreateRequest,
    actor: _OpsAndAbove,
    db: DbSession,
) -> MarketplaceCountryResponse:
    """Create a new marketplace country entry. 409 if code already exists."""
    mc = await _svc(db).create(body.model_dump(), UUID(actor["id"]))
    return MarketplaceCountryResponse.model_validate(mc)


# ---------------------------------------------------------------------------
# POST /admin/marketplace-countries/reorder  (must be before /{country_id})
# ---------------------------------------------------------------------------


@router.post("/reorder", status_code=204)
async def admin_reorder_marketplace_countries(
    body: MarketplaceCountryReorderRequest,
    actor: _OpsAndAbove,
    db: DbSession,
) -> None:
    """Set display_order for each id in the ordered list. 422 if any id unknown."""
    await _svc(db).reorder(body.ordered_ids, UUID(actor["id"]))


# ---------------------------------------------------------------------------
# PATCH /admin/marketplace-countries/{country_id}
# ---------------------------------------------------------------------------


@router.patch("/{country_id}", response_model=MarketplaceCountryResponse)
async def admin_update_marketplace_country(
    country_id: UUID,
    body: MarketplaceCountryUpdateRequest,
    actor: _OpsAndAbove,
    db: DbSession,
) -> MarketplaceCountryResponse:
    """Partially update a marketplace country. code is immutable."""
    updates = body.model_dump(exclude_unset=True)
    mc = await _svc(db).update(country_id, updates, UUID(actor["id"]))
    return MarketplaceCountryResponse.model_validate(mc)


# ---------------------------------------------------------------------------
# DELETE /admin/marketplace-countries/{country_id}
# ---------------------------------------------------------------------------


@router.delete("/{country_id}", status_code=204)
async def admin_delete_marketplace_country(
    country_id: UUID,
    actor: _OpsAndAbove,
    db: DbSession,
) -> None:
    """Hard-delete a marketplace country entry."""
    await _svc(db).delete(country_id, UUID(actor["id"]))
