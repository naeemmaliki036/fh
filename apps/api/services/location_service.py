"""Location service — CRUD for countries, cities, areas.

All writes require platform admin (enforced at router level).
Audit entries use entity_type 'country' | 'city' | 'area'.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.models.enums import AuditAction
from apps.api.models.location import Area, City, Country
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, not_found


class LocationService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Countries
    # ------------------------------------------------------------------

    async def list_countries(self, active_only: bool = True) -> list[dict]:
        stmt = select(
            Country,
            func.count(func.distinct(City.id)).label("city_count"),
            func.count(func.distinct(Area.id)).label("area_count"),
        ).outerjoin(City, City.country_id == Country.id).outerjoin(
            Area, Area.city_id == City.id
        ).group_by(Country.id).order_by(Country.ordering, Country.code)

        if active_only:
            stmt = stmt.where(Country.active.is_(True))

        rows = (await self.session.execute(stmt)).all()
        result = []
        for country, city_count, area_count in rows:
            result.append({"country": country, "city_count": city_count, "area_count": area_count})
        return result

    async def get_country(self, country_id: UUID) -> Country:
        c = await self.session.get(Country, country_id)
        if not c:
            raise not_found("Country")
        return c

    async def create_country(self, data: dict, actor_id: UUID) -> Country:
        existing = (await self.session.execute(
            select(Country).where(Country.code == data["code"])
        )).scalar_one_or_none()
        if existing:
            raise bad_request(f"Country code '{data['code']}' already exists")
        country = Country(**data)
        self.session.add(country)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_CREATED, actor_platform_user_id=actor_id,
            entity_type="country", entity_id=country.id,
            after={"code": country.code, "name": country.name},
        )
        await self.session.refresh(country)
        return country

    async def update_country(self, country_id: UUID, updates: dict, actor_id: UUID) -> Country:
        country = await self.get_country(country_id)
        before = {k: getattr(country, k) for k in updates}
        for k, v in updates.items():
            setattr(country, k, v)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_UPDATED, actor_platform_user_id=actor_id,
            entity_type="country", entity_id=country.id, before=before, after=updates,
        )
        await self.session.refresh(country)
        return country

    async def delete_country(self, country_id: UUID, actor_id: UUID) -> None:
        country = await self.get_country(country_id)
        code = country.code
        await self.session.delete(country)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_DELETED, actor_platform_user_id=actor_id,
            entity_type="country", entity_id=country_id, after={"code": code},
        )

    # ------------------------------------------------------------------
    # Cities
    # ------------------------------------------------------------------

    async def list_cities(self, country_id: UUID, active_only: bool = True) -> list[City]:
        stmt = (
            select(City).where(City.country_id == country_id)
            .order_by(City.ordering, City.slug)
        )
        if active_only:
            stmt = stmt.where(City.active.is_(True))
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_city(self, city_id: UUID) -> City:
        c = await self.session.get(City, city_id)
        if not c:
            raise not_found("City")
        return c

    async def create_city(self, country_id: UUID, data: dict, actor_id: UUID) -> City:
        country = await self.get_country(country_id)
        city = City(country_id=country.id, **data)
        self.session.add(city)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_CREATED, actor_platform_user_id=actor_id,
            entity_type="city", entity_id=city.id,
            after={"slug": city.slug, "label": city.label, "country_id": str(country_id)},
        )
        await self.session.refresh(city)
        return city

    async def update_city(self, city_id: UUID, updates: dict, actor_id: UUID) -> City:
        city = await self.get_city(city_id)
        before = {k: getattr(city, k) for k in updates}
        for k, v in updates.items():
            setattr(city, k, v)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_UPDATED, actor_platform_user_id=actor_id,
            entity_type="city", entity_id=city.id, before=before, after=updates,
        )
        await self.session.refresh(city)
        return city

    async def delete_city(self, city_id: UUID, actor_id: UUID) -> None:
        city = await self.get_city(city_id)
        slug = city.slug
        await self.session.delete(city)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_DELETED, actor_platform_user_id=actor_id,
            entity_type="city", entity_id=city_id, after={"slug": slug},
        )

    # ------------------------------------------------------------------
    # Areas
    # ------------------------------------------------------------------

    async def list_areas(self, city_id: UUID, active_only: bool = True) -> list[Area]:
        stmt = (
            select(Area).where(Area.city_id == city_id)
            .order_by(Area.ordering, Area.slug)
        )
        if active_only:
            stmt = stmt.where(Area.active.is_(True))
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_area(self, area_id: UUID) -> Area:
        a = await self.session.get(Area, area_id)
        if not a:
            raise not_found("Area")
        return a

    async def create_area(self, city_id: UUID, data: dict, actor_id: UUID) -> Area:
        city = await self.get_city(city_id)
        area = Area(city_id=city.id, **data)
        self.session.add(area)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_CREATED, actor_platform_user_id=actor_id,
            entity_type="area", entity_id=area.id,
            after={"slug": area.slug, "label": area.label, "city_id": str(city_id)},
        )
        await self.session.refresh(area)
        return area

    async def update_area(self, area_id: UUID, updates: dict, actor_id: UUID) -> Area:
        area = await self.get_area(area_id)
        before = {k: getattr(area, k) for k in updates}
        for k, v in updates.items():
            setattr(area, k, v)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_UPDATED, actor_platform_user_id=actor_id,
            entity_type="area", entity_id=area.id, before=before, after=updates,
        )
        await self.session.refresh(area)
        return area

    async def delete_area(self, area_id: UUID, actor_id: UUID) -> None:
        area = await self.get_area(area_id)
        slug = area.slug
        await self.session.delete(area)
        await self.session.flush()
        await self._audit.record(
            AuditAction.LOCATION_DELETED, actor_platform_user_id=actor_id,
            entity_type="area", entity_id=area_id, after={"slug": slug},
        )

    async def bulk_create_areas(
        self, city_id: UUID, items: list[dict], actor_id: UUID
    ) -> list[Area]:
        city = await self.get_city(city_id)
        created: list[Area] = []
        for item in items:
            existing = (await self.session.execute(
                select(Area).where(Area.city_id == city.id, Area.slug == item["slug"])
            )).scalar_one_or_none()
            if existing:
                continue
            area = Area(city_id=city.id, **item)
            self.session.add(area)
            await self.session.flush()
            created.append(area)
        if created:
            await self._audit.record(
                AuditAction.LOCATION_CREATED, actor_platform_user_id=actor_id,
                entity_type="area", entity_id=city_id,
                after={"bulk_count": len(created), "city_id": str(city_id)},
            )
        return created

    # ------------------------------------------------------------------
    # Full tree
    # ------------------------------------------------------------------

    async def get_full_tree(self) -> list[Country]:
        stmt = (
            select(Country)
            .where(Country.active.is_(True))
            .options(
                selectinload(Country.cities).selectinload(City.areas)
            )
            .order_by(Country.ordering)
        )
        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows)
