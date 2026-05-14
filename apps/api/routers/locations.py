"""Public location endpoints — no auth required.

GET /locations/countries
GET /locations/countries/{country_id}/cities
GET /locations/cities/{city_id}/areas
GET /locations/all
"""

from uuid import UUID

from fastapi import APIRouter

from apps.api.dependencies import DbSession
from apps.api.schemas.location import (
    AreaResponse,
    CityResponse,
    CountryTree,
    CountryWithCounts,
)
from apps.api.services.location_service import LocationService

router = APIRouter()


def _svc(db: DbSession) -> LocationService:
    return LocationService(db)


@router.get("/countries", response_model=list[CountryWithCounts])
async def list_countries(db: DbSession) -> list[CountryWithCounts]:
    """Active countries with city + area counts."""
    rows = await _svc(db).list_countries(active_only=True)
    return [
        CountryWithCounts.model_validate(r["country"]).model_copy(
            update={"city_count": r["city_count"], "area_count": r["area_count"]}
        )
        for r in rows
    ]


@router.get("/countries/{country_id}/cities", response_model=list[CityResponse])
async def list_cities(country_id: UUID, db: DbSession) -> list[CityResponse]:
    """Active cities for a country."""
    cities = await _svc(db).list_cities(country_id, active_only=True)
    return [CityResponse.model_validate(c) for c in cities]


@router.get("/cities/{city_id}/areas", response_model=list[AreaResponse])
async def list_areas(city_id: UUID, db: DbSession) -> list[AreaResponse]:
    """Active areas for a city."""
    areas = await _svc(db).list_areas(city_id, active_only=True)
    return [AreaResponse.model_validate(a) for a in areas]


@router.get("/all", response_model=list[CountryTree])
async def get_full_tree(db: DbSession) -> list[CountryTree]:
    """Full active location tree for client-side caching."""
    countries = await _svc(db).get_full_tree()
    return [CountryTree.model_validate(c) for c in countries]
