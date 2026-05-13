"""Property CRUD service."""

from datetime import date
from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, PropertyStatus, PropertyType, TenantRole
from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
}


_PROPERTY_ALLOWED_TRANSITIONS: dict[PropertyStatus, set[PropertyStatus]] = {
    PropertyStatus.AVAILABLE: {PropertyStatus.OFF_MARKET},
    PropertyStatus.OFF_MARKET: {PropertyStatus.AVAILABLE},
}


class PropertyService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("property_admin, company_admin or company_owner required")

    async def _media_count(self, property_id: UUID) -> int:
        r = await self.session.execute(
            select(func.count()).where(Media.property_id == property_id)
        )
        return r.scalar_one()

    async def _listing_count(self, property_id: UUID) -> int:
        r = await self.session.execute(
            select(func.count()).where(Listing.property_id == property_id)
        )
        return r.scalar_one()

    async def _get_agents(self, property_id: UUID) -> list[PropertyAgent]:
        r = await self.session.execute(
            select(PropertyAgent).where(PropertyAgent.property_id == property_id)
        )
        return list(r.scalars().all())

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_properties(
        self,
        tenant_id: UUID,
        *,
        status: PropertyStatus | None = None,
        property_type: PropertyType | None = None,
        country: str | None = None,
        city: str | None = None,
        area: str | None = None,
        assigned_agent_id: UUID | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        currency: str | None = None,
        min_bedrooms: int | None = None,
        max_bedrooms: int | None = None,
        min_bathrooms: int | None = None,
        max_bathrooms: int | None = None,
        min_size_sqft: float | None = None,
        max_size_sqft: float | None = None,
        tags: list[str] | None = None,
        created_from: date | None = None,
        created_to: date | None = None,
        has_listing: bool | None = None,
        q: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[dict], int]:
        await self._set_rls(tenant_id)

        stmt = select(Property).where(Property.tenant_id == tenant_id)

        if assigned_agent_id is not None:
            stmt = stmt.join(
                PropertyAgent,
                (PropertyAgent.property_id == Property.id)
                & (PropertyAgent.agent_id == assigned_agent_id),
            )

        if status:
            stmt = stmt.where(Property.status == status)
        if property_type:
            stmt = stmt.where(Property.property_type == property_type)
        if country:
            stmt = stmt.where(Property.country.ilike(f"%{country}%"))
        if city:
            stmt = stmt.where(Property.city.ilike(f"%{city}%"))
        if area:
            stmt = stmt.where(Property.area.ilike(f"%{area}%"))
        if min_price is not None:
            stmt = stmt.where(Property.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Property.price <= max_price)
        if currency:
            stmt = stmt.where(Property.currency == currency.upper())
        if min_bedrooms is not None:
            stmt = stmt.where(Property.bedrooms >= min_bedrooms)
        if max_bedrooms is not None:
            stmt = stmt.where(Property.bedrooms <= max_bedrooms)
        if min_bathrooms is not None:
            stmt = stmt.where(Property.bathrooms >= min_bathrooms)
        if max_bathrooms is not None:
            stmt = stmt.where(Property.bathrooms <= max_bathrooms)
        if min_size_sqft is not None:
            stmt = stmt.where(Property.size_sqft >= min_size_sqft)
        if max_size_sqft is not None:
            stmt = stmt.where(Property.size_sqft <= max_size_sqft)
        if tags:
            # All given tags must be present (case-insensitive).
            # Use one ILIKE-per-tag approach: safe, no special PG casting issues.
            for tag in tags:
                stmt = stmt.where(
                    func.array_to_string(Property.tags, ",").ilike(f"%{tag}%")
                )
        if created_from:
            stmt = stmt.where(Property.created_at >= created_from)
        if created_to:
            stmt = stmt.where(Property.created_at <= created_to)
        if has_listing is True:
            sub = select(Listing.property_id).where(Listing.tenant_id == tenant_id)
            stmt = stmt.where(Property.id.in_(sub))
        elif has_listing is False:
            sub = select(Listing.property_id).where(Listing.tenant_id == tenant_id)
            stmt = stmt.where(Property.id.notin_(sub))
        if q:
            pattern = f"%{q}%"
            stmt = stmt.where(or_(
                Property.title.ilike(pattern),
                Property.description.ilike(pattern),
                Property.internal_reference.ilike(pattern),
            ))

        # Sorting
        _sort_cols = {
            "created_at": Property.created_at,
            "updated_at": Property.updated_at,
            "price": Property.price,
            "title": Property.title,
        }
        col = _sort_cols.get(sort_by, Property.created_at)
        order_col = col.asc() if sort_dir == "asc" else col.desc()

        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        props = list((await self.session.execute(
            stmt.order_by(order_col).offset(skip).limit(limit)
        )).scalars().all())
        return [{"property": p, "assigned_agents": [], "media_count": 0, "listing_count": 0} for p in props], total

    async def get_property(self, property_id: UUID, tenant_id: UUID) -> dict:
        await self._set_rls(tenant_id)
        prop = await self.session.get(Property, property_id)
        if not prop or prop.tenant_id != tenant_id:
            raise not_found("Property")
        agents = await self._get_agents(property_id)
        return {
            "property": prop,
            "assigned_agents": agents,
            "media_count": await self._media_count(property_id),
            "listing_count": await self._listing_count(property_id),
        }

    # ------------------------------------------------------------------
    # Create / Update / Delete
    # ------------------------------------------------------------------

    async def create_property(
        self, tenant_id: UUID, current_user: dict, agent_ids: list[UUID] | None, **fields
    ) -> dict:
        from apps.api.services.operating_countries_validator import validate_country_for_tenant

        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        country = fields.pop("country", None) or "AE"
        await validate_country_for_tenant(self.session, tenant_id, country)
        tags = fields.pop("tags", None) or []
        prop = Property(
            tenant_id=tenant_id,
            country=country,
            created_by_user_id=UUID(current_user["id"]),
            tags=tags,
            **fields,
        )
        self.session.add(prop)
        await self.session.flush()

        assignments: list[PropertyAgent] = []
        if agent_ids:
            for i, aid in enumerate(agent_ids):
                pa = PropertyAgent(
                    property_id=prop.id, agent_id=aid,
                    tenant_id=tenant_id, is_primary=(i == 0)
                )
                self.session.add(pa)
                assignments.append(pa)
            await self.session.flush()

        await self.session.refresh(prop)
        return {"property": prop, "assigned_agents": assignments, "media_count": 0, "listing_count": 0}

    async def update_property(
        self, property_id: UUID, tenant_id: UUID, current_user: dict, updates: dict
    ) -> dict:
        self._require_manager(current_user["role"])
        data = await self.get_property(property_id, tenant_id)
        prop = data["property"]

        old_tags = list(prop.tags or [])
        new_tags_in_update = "tags" in updates
        new_tags = updates.get("tags", old_tags)

        allowed = {
            "title", "description", "property_type", "bedrooms", "bathrooms",
            "size_sqft", "price", "currency", "address_line", "city", "area",
            "country", "latitude", "longitude", "amenities", "internal_reference",
            "tags",
            # "status" excluded — must go through change_status() for audit trail
        }
        if "country" in updates and updates["country"]:
            from apps.api.services.operating_countries_validator import validate_country_for_tenant
            await validate_country_for_tenant(self.session, tenant_id, updates["country"])
        for k, v in updates.items():
            if k in allowed:
                setattr(prop, k, v)
        await self.session.flush()

        if new_tags_in_update and sorted([t.lower() for t in old_tags]) != sorted([t.lower() for t in (new_tags or [])]):
            await self._audit.record(
                AuditAction.PROPERTY_TAGS_CHANGED,
                tenant_id=tenant_id,
                actor_user_id=UUID(current_user["id"]),
                entity_type="property",
                entity_id=prop.id,
                before={"tags": old_tags},
                after={"tags": list(prop.tags or [])},
            )

        await self.session.refresh(prop)
        agents = await self._get_agents(property_id)
        return {
            "property": prop, "assigned_agents": agents,
            "media_count": await self._media_count(property_id),
            "listing_count": await self._listing_count(property_id),
        }

    async def deactivate_property(
        self, property_id: UUID, tenant_id: UUID, current_user: dict
    ) -> None:
        self._require_manager(current_user["role"])
        data = await self.get_property(property_id, tenant_id)
        data["property"].status = PropertyStatus.OFF_MARKET
        await self.session.flush()

    async def change_status(
        self,
        property_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        new_status: PropertyStatus,
        reason_code: str,
        reason_note: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        _manual_only = {PropertyStatus.AVAILABLE, PropertyStatus.OFF_MARKET}
        if new_status not in _manual_only:
            raise bad_request(
                f"Status '{new_status.value}' cannot be set manually; "
                "reserved/sold/rented/draft are deal-flow transitions"
            )
        self._require_manager(current_user["role"])
        data = await self.get_property(property_id, tenant_id)
        prop = data["property"]

        if prop.status == new_status:
            raise conflict(f"Property is already {new_status.value}")

        allowed = _PROPERTY_ALLOWED_TRANSITIONS.get(prop.status, set())
        if new_status not in allowed:
            raise bad_request(
                f"Transition {prop.status.value} → {new_status.value} is not allowed"
            )

        old_status = prop.status
        prop.status = new_status
        await self.session.flush()

        await self._audit.record(
            AuditAction.PROPERTY_STATUS_CHANGED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="property",
            entity_id=prop.id,
            after={
                "from": old_status.value,
                "to": new_status.value,
                "reason_code": reason_code,
                "reason_note": reason_note,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(prop)
        agents = await self._get_agents(property_id)
        return {
            "property": prop,
            "assigned_agents": agents,
            "media_count": await self._media_count(property_id),
            "listing_count": await self._listing_count(property_id),
        }
