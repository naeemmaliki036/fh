"""Agent service — CRUD + photo management for tenant agents."""

from uuid import UUID

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.enums import AgentStatus, AuditAction, TenantRole
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, conflict, forbidden, not_found

_MANAGER_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.PROPERTY_ADMIN.value,
}
_OWNER_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}
_MAX_PHOTO_BYTES = 5 * 1024 * 1024
_PHOTO_MIME = {"image/jpeg", "image/png", "image/webp"}


class AgentService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_manager(self, role: str) -> None:
        if role not in _MANAGER_ROLES:
            raise forbidden("company_owner, company_admin or property_admin required")

    def _require_owner(self, role: str) -> None:
        if role not in _OWNER_ROLES:
            raise forbidden("company_owner or company_admin required")

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_agents(
        self,
        tenant_id: UUID,
        *,
        status: AgentStatus | None = None,
        q: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Agent], int]:
        await self._set_rls(tenant_id)
        stmt = select(Agent).where(Agent.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(Agent.status == status)
        if q:
            pattern = f"%{q}%"
            stmt = stmt.where(
                or_(
                    Agent.full_name.ilike(pattern),
                    Agent.email.ilike(pattern),
                )
            )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()
        items = list((await self.session.execute(stmt.offset(skip).limit(limit))).scalars().all())
        return items, total

    async def get_agent(self, agent_id: UUID, tenant_id: UUID) -> Agent:
        await self._set_rls(tenant_id)
        agent = await self.session.get(Agent, agent_id)
        if not agent or agent.tenant_id != tenant_id:
            raise not_found("Agent")
        return agent

    # ------------------------------------------------------------------
    # Create / update / delete
    # ------------------------------------------------------------------

    async def create_agent(
        self, tenant_id: UUID, current_user: dict, **fields
    ) -> Agent:
        self._require_manager(current_user["role"])
        await self._set_rls(tenant_id)
        email = str(fields.get("email", "")).lower()
        exists = await self.session.execute(
            select(Agent.id).where(
                Agent.tenant_id == tenant_id, func.lower(Agent.email) == email
            )
        )
        if exists.scalar_one_or_none():
            raise conflict(f"Agent email '{email}' already exists in this tenant")
        agent = Agent(tenant_id=tenant_id, **{**fields, "email": email})
        self.session.add(agent)
        await self.session.flush()
        await self.session.refresh(agent)
        return agent

    async def update_agent(
        self,
        agent_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        updates: dict,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Agent:
        self._require_manager(current_user["role"])
        agent = await self.get_agent(agent_id, tenant_id)
        old_commission = {
            "type": agent.default_commission_type.value,
            "value": str(agent.default_commission_value),
        }
        allowed = {
            "full_name", "email", "phone", "license_id",
            "license_expiry_at", "default_commission_type",
            "default_commission_value", "linked_user_id",
        }
        for field, value in updates.items():
            if field in allowed and value is not None:
                setattr(agent, field, value)
        await self.session.flush()
        new_commission = {
            "type": agent.default_commission_type.value,
            "value": str(agent.default_commission_value),
        }
        if old_commission != new_commission:
            await self._audit.record(
                AuditAction.AGENT_COMMISSION_CHANGED,
                tenant_id=tenant_id,
                actor_user_id=UUID(current_user["id"]),
                entity_type="agent",
                entity_id=agent.id,
                before=old_commission,
                after=new_commission,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        await self.session.refresh(agent)
        return agent

    async def deactivate_agent(
        self, agent_id: UUID, tenant_id: UUID, current_user: dict
    ) -> None:
        self._require_owner(current_user["role"])
        agent = await self.get_agent(agent_id, tenant_id)
        agent.status = AgentStatus.INACTIVE
        await self.session.flush()

    async def change_status(
        self,
        agent_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        new_status: AgentStatus,
        reason_code: str,
        reason_note: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> "Agent":
        from packages.common.utils.error_handlers import conflict as _conflict
        self._require_manager(current_user["role"])
        agent = await self.get_agent(agent_id, tenant_id)
        if agent.status == new_status:
            raise _conflict(f"Agent is already {new_status.value}")
        old_status = agent.status
        agent.status = new_status
        await self.session.flush()
        await self._audit.record(
            AuditAction.AGENT_STATUS_CHANGED,
            tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="agent",
            entity_id=agent.id,
            after={
                "from": old_status.value,
                "to": new_status.value,
                "reason_code": reason_code,
                "reason_note": reason_note,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await self.session.refresh(agent)
        return agent

    # ------------------------------------------------------------------
    # Photo
    # ------------------------------------------------------------------

    async def set_photo(
        self,
        agent_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        file_bytes: bytes,
        mime_type: str,
        ext: str,
    ) -> tuple[str, str]:
        """Upload photo to public storage. Returns (photo_key, url)."""
        self._require_manager(current_user["role"])
        if mime_type not in _PHOTO_MIME:
            raise bad_request(f"Unsupported photo type '{mime_type}'. Use jpeg, png or webp.")
        if len(file_bytes) > _MAX_PHOTO_BYTES:
            raise bad_request("Photo exceeds 5 MB limit")
        agent = await self.get_agent(agent_id, tenant_id)
        from packages.common.storage import get_public_storage
        storage = get_public_storage()
        key = f"public/agent-photos/{tenant_id}/{agent_id}.{ext}"
        await storage.put_object(key, file_bytes, mime_type)
        agent.photo_key = key
        await self.session.flush()
        if storage.public_base_url:
            url = f"{storage.public_base_url}/{key}"
        else:
            url = await storage.get_signed_url(key)
        return key, url

    async def delete_photo(
        self, agent_id: UUID, tenant_id: UUID, current_user: dict
    ) -> None:
        self._require_manager(current_user["role"])
        agent = await self.get_agent(agent_id, tenant_id)
        if not agent.photo_key:
            return
        from packages.common.storage import get_public_storage
        storage = get_public_storage()
        await storage.delete_object(agent.photo_key)
        agent.photo_key = None
        await self.session.flush()
