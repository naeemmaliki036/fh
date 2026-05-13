"""Tenant detail service — rich admin portal view with counts + audit trail.

Kept separate from TenantService to respect the 300 LOC cap.
Available only to platform admin roles (super/operations/finance/support).
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.agent import Agent
from apps.api.models.audit_log import AuditLog
from apps.api.models.deal import Deal
from apps.api.models.enums import AgentStatus, ListingStatus
from apps.api.models.lead import Lead
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.tenant import Tenant
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import not_found


class TenantDetailService(BaseService):
    """Fetches the rich detail view for the admin portal."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def get_detail(self, tenant_id: UUID) -> dict:
        """Return tenant + counts + recent audit log entries.

        No RLS GUC is set — these queries run as the DB owner and are
        explicitly scoped by tenant_id WHERE clauses.
        """
        tenant = await self.session.get(Tenant, tenant_id)
        if not tenant:
            raise not_found("Tenant")

        counts = await self._get_counts(tenant_id)
        recent_activity = await self._get_recent_audit(tenant_id, limit=20)

        return {
            "tenant": tenant,
            "counts": counts,
            "recent_activity": recent_activity,
            "subscription_info": {"plan": "free", "status": "active"},
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _get_counts(self, tenant_id: UUID) -> dict:
        """Single-pass count queries for all entity types."""

        async def _count(model, extra_where=None):
            stmt = select(func.count()).select_from(model).where(
                model.tenant_id == tenant_id
            )
            if extra_where is not None:
                stmt = stmt.where(extra_where)
            return (await self.session.execute(stmt)).scalar_one()

        users_count = await _count(User)
        agents_count = await _count(Agent, Agent.status == AgentStatus.ACTIVE)
        properties_count = await _count(Property)
        listings_count = await _count(Listing, Listing.status == ListingStatus.ACTIVE)
        leads_count = await _count(Lead)
        deals_count = await _count(Deal)

        return {
            "users_count": users_count,
            "agents_count": agents_count,
            "properties_count": properties_count,
            "listings_count": listings_count,
            "leads_count": leads_count,
            "deals_count": deals_count,
        }

    async def _get_recent_audit(self, tenant_id: UUID, limit: int) -> list[dict]:
        """Last *limit* audit log rows for this tenant with actor names attached."""
        stmt = (
            select(AuditLog)
            .where(AuditLog.tenant_id == tenant_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        actor_ids = {r.actor_user_id for r in rows if r.actor_user_id}
        users: dict[UUID, User] = {}
        if actor_ids:
            u_result = await self.session.execute(
                select(User).where(User.id.in_(actor_ids))
            )
            users = {u.id: u for u in u_result.scalars().all()}

        out: list[dict] = []
        for r in rows:
            u = users.get(r.actor_user_id) if r.actor_user_id else None
            out.append({
                "id": r.id,
                "created_at": r.created_at,
                "action": r.action,
                "tenant_id": r.tenant_id,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "actor_user_id": r.actor_user_id,
                "actor_platform_user_id": r.actor_platform_user_id,
                "actor": (
                    {"id": u.id, "full_name": u.full_name, "email": u.email}
                    if u else None
                ),
                "metadata_before": r.metadata_before,
                "metadata_after": r.metadata_after,
            })
        return out
