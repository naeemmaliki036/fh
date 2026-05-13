"""Property CRUD service."""

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
        city: str | None = None,
        area: str | None = None,
        q: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[dict], int]:
        await self._set_rls(tenant_id)
        stmt = select(Property).where(Property.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(Property.status == status)
        if property_type:
            stmt = stmt.where(Property.property_type == property_type)
        if city:
            stmt = stmt.where(Property.city.ilike(f"%{city}%"))
        if area:
            stmt = stmt.where(Property.area.ilike(f"%{area}%"))
        if q:
            pattern = f"%{q}%"
            stmt = stmt.where(or_(
                Property.title.ilike(pattern),
                Property.internal_reference.ilike(pattern),
                Property.address_line.ilike(pattern),
            ))
        total = (await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )).scalar_one()
        props = list((await self.session.execute(
            stmt.order_by(Property.created_at.desc()).offset(skip).limit(limit)
        )).scalars().all())
        # Lightweight list — skip agent/media/listing counts for perf
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
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        prop = Property(
            tenant_id=tenant_id,
            country=fields.pop("country", None) or "AE",
            created_by_user_id=UUID(current_user["id"]),
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
        allowed = {
            "title", "description", "property_type", "bedrooms", "bathrooms",
            "size_sqft", "price", "currency", "address_line", "city", "area",
            "country", "latitude", "longitude", "amenities", "internal_reference",
            # "status" excluded — must go through change_status() for audit trail
        }
        for k, v in updates.items():
            if k in allowed:
                setattr(prop, k, v)
        await self.session.flush()
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
