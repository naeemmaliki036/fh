"""Property↔Agent assignment service.

Split from property_service.py to stay under 300 LOC.
"""

from uuid import UUID

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import TenantRole
from apps.api.models.property_agent import PropertyAgent
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
}


class PropertyAgentService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("property_admin, company_admin or company_owner required")

    async def _get_assignment(self, property_id: UUID, agent_id: UUID) -> PropertyAgent:
        row = await self.session.get(PropertyAgent, (property_id, agent_id))
        if not row:
            raise not_found("Agent assignment")
        return row

    async def _demote_primary(self, property_id: UUID) -> None:
        """Clear is_primary on the current primary assignment for this property."""
        await self.session.execute(
            update(PropertyAgent)
            .where(PropertyAgent.property_id == property_id, PropertyAgent.is_primary.is_(True))
            .values(is_primary=False)
        )

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_assignments(self, property_id: UUID, tenant_id: UUID) -> list[PropertyAgent]:
        await self._set_rls(tenant_id)
        r = await self.session.execute(
            select(PropertyAgent).where(PropertyAgent.property_id == property_id)
        )
        return list(r.scalars().all())

    # ------------------------------------------------------------------
    # Add
    # ------------------------------------------------------------------

    async def add_agent(
        self,
        property_id: UUID,
        agent_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        is_primary: bool = False,
    ) -> PropertyAgent:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)

        existing = await self.session.get(PropertyAgent, (property_id, agent_id))
        if existing:
            raise conflict("Agent already assigned to this property")

        if is_primary:
            await self._demote_primary(property_id)

        pa = PropertyAgent(
            property_id=property_id,
            agent_id=agent_id,
            tenant_id=tenant_id,
            is_primary=is_primary,
        )
        self.session.add(pa)
        await self.session.flush()
        return pa

    # ------------------------------------------------------------------
    # Update (flip primary)
    # ------------------------------------------------------------------

    async def update_agent(
        self,
        property_id: UUID,
        agent_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        is_primary: bool,
    ) -> PropertyAgent:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        pa = await self._get_assignment(property_id, agent_id)

        if is_primary and not pa.is_primary:
            await self._demote_primary(property_id)

        pa.is_primary = is_primary
        await self.session.flush()
        return pa

    # ------------------------------------------------------------------
    # Remove
    # ------------------------------------------------------------------

    async def remove_agent(
        self,
        property_id: UUID,
        agent_id: UUID,
        tenant_id: UUID,
        current_user: dict,
    ) -> None:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        pa = await self._get_assignment(property_id, agent_id)
        if pa.is_primary:
            raise bad_request("Cannot remove the primary agent. Reassign primary first.")
        await self.session.delete(pa)
        await self.session.flush()
