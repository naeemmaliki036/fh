"""Lead activity service — append-only timeline management."""

from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import LeadActivityKind, TenantRole
from apps.api.models.lead_activity import LeadActivity
from apps.api.models.user import User
from apps.api.schemas.lead_activity import DELETABLE_KINDS, SYSTEM_ONLY_KINDS
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class LeadActivityService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    # ------------------------------------------------------------------
    # Append (internal — called by lead service for system events)
    # ------------------------------------------------------------------

    async def append(
        self,
        lead_id: UUID,
        tenant_id: UUID,
        kind: LeadActivityKind,
        *,
        description: str | None = None,
        activity_metadata: dict | None = None,
        actor_user_id: UUID | None = None,
    ) -> LeadActivity:
        """Insert one activity row. Caller owns the transaction."""
        activity = LeadActivity(
            lead_id=lead_id,
            tenant_id=tenant_id,
            kind=kind,
            description=description,
            activity_metadata=activity_metadata,
            actor_user_id=actor_user_id,
        )
        self.session.add(activity)
        await self.session.flush()
        await self.session.refresh(activity)
        return activity

    # ------------------------------------------------------------------
    # Manual POST (user-initiated)
    # ------------------------------------------------------------------

    async def create_manual(
        self,
        lead_id: UUID,
        tenant_id: UUID,
        current_user: dict,
        kind: LeadActivityKind,
        description: str | None,
        activity_metadata: dict | None,
    ) -> LeadActivity:
        if kind in SYSTEM_ONLY_KINDS:
            raise bad_request(
                f"'{kind.value}' activities are system-generated and cannot be posted manually"
            )
        await self._set_rls(tenant_id)
        return await self.append(
            lead_id, tenant_id, kind,
            description=description,
            activity_metadata=activity_metadata,
            actor_user_id=UUID(current_user["id"]),
        )

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    async def list_activities(
        self,
        lead_id: UUID,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[dict], int]:
        await self._set_rls(tenant_id)
        # Join user for actor_full_name
        stmt = (
            select(LeadActivity, User.full_name.label("actor_full_name"))
            .outerjoin(User, User.id == LeadActivity.actor_user_id)
            .where(LeadActivity.lead_id == lead_id, LeadActivity.tenant_id == tenant_id)
            .order_by(LeadActivity.created_at.desc())
        )
        total_stmt = select(
            text("count(*)")
        ).select_from(
            select(LeadActivity.id)
            .where(LeadActivity.lead_id == lead_id, LeadActivity.tenant_id == tenant_id)
            .subquery()
        )
        total = (await self.session.execute(total_stmt)).scalar_one()
        rows = (await self.session.execute(stmt.offset(skip).limit(limit))).all()
        result = []
        for activity, actor_name in rows:
            result.append({"activity": activity, "actor_full_name": actor_name})
        return result, total

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_activity(
        self,
        activity_id: UUID,
        lead_id: UUID,
        tenant_id: UUID,
        current_user: dict,
    ) -> None:
        if current_user["role"] not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")
        await self._set_rls(tenant_id)
        activity = await self.session.get(LeadActivity, activity_id)
        if not activity or activity.lead_id != lead_id or activity.tenant_id != tenant_id:
            raise not_found("Activity")
        if activity.kind not in DELETABLE_KINDS:
            raise forbidden(
                f"Only '{LeadActivityKind.NOTE.value}' activities can be deleted"
            )
        await self.session.delete(activity)
        await self.session.flush()
