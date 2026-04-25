"""Audit service — write-only event ledger.

Callers must NOT commit after calling record(); the calling service owns the
transaction so that the audit row and the business action are atomic.
"""

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.audit_log import AuditLog
from apps.api.models.enums import AuditAction
from apps.api.services.base import BaseService


class AuditService(BaseService):
    """Inserts AuditLog rows within the caller's transaction."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def record(
        self,
        action: AuditAction,
        *,
        tenant_id: UUID | None = None,
        actor_user_id: UUID | None = None,
        actor_platform_user_id: UUID | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        before: dict | None = None,
        after: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        """Insert one audit row and flush so its id is populated.

        For tenant-scoped writes the GUC must already be set by the calling
        service (via _set_rls). For platform-only writes (tenant_id=None)
        the RLS policy allows NULL-tenant rows regardless of GUC state.
        """
        if tenant_id is not None:
            # Ensure RLS GUC is consistent with the row we're writing.
            # SET LOCAL is idempotent — safe to call again if already set.
            await self.session.execute(
                text(f"SET LOCAL app.tenant_id = '{tenant_id}'")
            )

        row = AuditLog(
            action=action,
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            actor_platform_user_id=actor_platform_user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_before=before,
            metadata_after=after,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(row)
        await self.session.flush()
        return row
