"""Platform-admin location CRUD endpoints.

All routes require super_admin or operations_admin.
Registered under /admin/locations.
"""

import re
from uuid import UUID

from fastapi import APIRouter, Depends

from apps.api.dependencies import CurrentPlatformUser, DbSession
from apps.api.models.enums import PlatformRole
from apps.api.schemas.location import (
    AreaBulkCreate,
    AreaCreate,
    AreaResponse,
    AreaUpdate,
    CityCreate,
    CityResponse,
    CityUpdate,
    CountryCreate,
    CountryResponse,
    CountryUpdate,
    CountryWithCounts,
)
from apps.api.services.location_service import LocationService
from packages.common.utils.error_handlers import forbidden

router = APIRouter()

_ALLOWED_ROLES = {PlatformRole.SUPER_ADMIN.value, PlatformRole.OPERATIONS_ADMIN.value}
_SUPER_ADMIN_ONLY = {PlatformRole.SUPER_ADMIN.value}


def _require_admin(user: dict) -> None:
    if user.get("role") not in _ALLOWED_ROLES:
        raise forbidden("super_admin or operations_admin required")


def _require_super(user: dict) -> None:
    if user.get("role") not in _SUPER_ADMIN_ONLY:
        raise forbidden("super_admin required")


def _svc(db: DbSession) -> LocationService:
    return LocationService(db)


def _to_slug(label: str) -> str:
    """kebab-case slug from a free-text label."""
    slug = label.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


# ---------------------------------------------------------------------------
# Countries
# ---------------------------------------------------------------------------

@router.get("/countries", response_model=list[CountryWithCounts])
async def admin_list_countries(
    current_user: CurrentPlatformUser, db: DbSession
) -> list[CountryWithCounts]:
    _require_admin(current_user)
    rows = await _svc(db).list_countries(active_only=False)
    return [
        CountryWithCounts.model_validate(r["country"]).model_copy(
            update={"city_count": r["city_count"], "area_count": r["area_count"]}
        )
        for r in rows
    ]


@router.post("/countries", response_model=CountryResponse, status_code=201)
async def create_country(
    body: CountryCreate, current_user: CurrentPlatformUser, db: DbSession
) -> CountryResponse:
    _require_admin(current_user)
    country = await _svc(db).create_country(
        body.model_dump(), UUID(current_user["id"])
    )
    return CountryResponse.model_validate(country)


@router.patch("/countries/{country_id}", response_model=CountryResponse)
async def update_country(
    country_id: UUID, body: CountryUpdate,
    current_user: CurrentPlatformUser, db: DbSession,
) -> CountryResponse:
    _require_admin(current_user)
    country = await _svc(db).update_country(
        country_id, body.model_dump(exclude_unset=True), UUID(current_user["id"])
    )
    return CountryResponse.model_validate(country)


@router.delete("/countries/{country_id}", status_code=204)
async def delete_country(
    country_id: UUID, current_user: CurrentPlatformUser, db: DbSession
) -> None:
    _require_admin(current_user)
    await _svc(db).delete_country(country_id, UUID(current_user["id"]))


# ---------------------------------------------------------------------------
# Cities
# ---------------------------------------------------------------------------

@router.get("/countries/{country_id}/cities", response_model=list[CityResponse])
async def admin_list_cities(
    country_id: UUID, current_user: CurrentPlatformUser, db: DbSession
) -> list[CityResponse]:
    _require_admin(current_user)
    cities = await _svc(db).list_cities(country_id, active_only=False)
    return [CityResponse.model_validate(c) for c in cities]


@router.post("/countries/{country_id}/cities", response_model=CityResponse, status_code=201)
async def create_city(
    country_id: UUID, body: CityCreate,
    current_user: CurrentPlatformUser, db: DbSession,
) -> CityResponse:
    _require_admin(current_user)
    city = await _svc(db).create_city(
        country_id, body.model_dump(), UUID(current_user["id"])
    )
    return CityResponse.model_validate(city)


@router.patch("/cities/{city_id}", response_model=CityResponse)
async def update_city(
    city_id: UUID, body: CityUpdate,
    current_user: CurrentPlatformUser, db: DbSession,
) -> CityResponse:
    _require_admin(current_user)
    city = await _svc(db).update_city(
        city_id, body.model_dump(exclude_unset=True), UUID(current_user["id"])
    )
    return CityResponse.model_validate(city)


@router.delete("/cities/{city_id}", status_code=204)
async def delete_city(
    city_id: UUID, current_user: CurrentPlatformUser, db: DbSession
) -> None:
    _require_admin(current_user)
    await _svc(db).delete_city(city_id, UUID(current_user["id"]))


# ---------------------------------------------------------------------------
# Areas
# ---------------------------------------------------------------------------

@router.get("/cities/{city_id}/areas", response_model=list[AreaResponse])
async def admin_list_areas(
    city_id: UUID, current_user: CurrentPlatformUser, db: DbSession
) -> list[AreaResponse]:
    _require_admin(current_user)
    areas = await _svc(db).list_areas(city_id, active_only=False)
    return [AreaResponse.model_validate(a) for a in areas]


@router.post("/cities/{city_id}/areas", response_model=AreaResponse, status_code=201)
async def create_area(
    city_id: UUID, body: AreaCreate,
    current_user: CurrentPlatformUser, db: DbSession,
) -> AreaResponse:
    _require_admin(current_user)
    area = await _svc(db).create_area(
        city_id, body.model_dump(), UUID(current_user["id"])
    )
    return AreaResponse.model_validate(area)


@router.patch("/areas/{area_id}", response_model=AreaResponse)
async def update_area(
    area_id: UUID, body: AreaUpdate,
    current_user: CurrentPlatformUser, db: DbSession,
) -> AreaResponse:
    _require_admin(current_user)
    area = await _svc(db).update_area(
        area_id, body.model_dump(exclude_unset=True), UUID(current_user["id"])
    )
    return AreaResponse.model_validate(area)


@router.delete("/areas/{area_id}", status_code=204)
async def delete_area(
    area_id: UUID, current_user: CurrentPlatformUser, db: DbSession
) -> None:
    _require_admin(current_user)
    await _svc(db).delete_area(area_id, UUID(current_user["id"]))


@router.post("/areas/bulk", response_model=list[AreaResponse], status_code=201)
async def bulk_create_areas(
    body: AreaBulkCreate, current_user: CurrentPlatformUser, db: DbSession
) -> list[AreaResponse]:
    """Bulk insert areas — slugs auto-generated from label if empty.

    Skips duplicates silently. super_admin only.
    """
    _require_super(current_user)
    items = []
    for item in body.items:
        slug = item.slug if item.slug else _to_slug(item.label)
        items.append({"slug": slug, "label": item.label, "ordering": 0})
    areas = await _svc(db).bulk_create_areas(
        body.city_id, items, UUID(current_user["id"])
    )
    return [AreaResponse.model_validate(a) for a in areas]
