"""Off-market reason CRUD service.

Platform rows (tenant_id IS NULL) are read-only for tenants.
Tenant rows are scoped to the requesting tenant.
"""

from uuid import UUID

from sqlalchemy import or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction, TenantRole
from apps.api.models.off_market_reason import OffMarketReason
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden, not_found

_ADMIN_ROLES = {TenantRole.COMPANY_OWNER.value, TenantRole.COMPANY_ADMIN.value}


class OffMarketReasonService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    async def _set_rls(self, tenant_id: UUID) -> None:
        await self.session.execute(text(f"SET LOCAL app.tenant_id = '{tenant_id}'"))

    def _require_admin(self, role: str) -> None:
        if role not in _ADMIN_ROLES:
            raise forbidden("company_owner or company_admin required")

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def list_reasons(self, tenant_id: UUID) -> list[OffMarketReason]:
        """Return platform defaults + tenant overrides merged, ordered."""
        stmt = (
            select(OffMarketReason)
            .where(
                or_(
                    OffMarketReason.tenant_id.is_(None),
                    OffMarketReason.tenant_id == tenant_id,
                ),
                OffMarketReason.active.is_(True),
            )
            .order_by(OffMarketReason.ordering, OffMarketReason.code)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_reason(self, reason_id: UUID, tenant_id: UUID) -> OffMarketReason:
        reason = await self.session.get(OffMarketReason, reason_id)
        if not reason:
            raise not_found("OffMarketReason")
        # Visible if platform-level or own tenant
        if reason.tenant_id is not None and reason.tenant_id != tenant_id:
            raise not_found("OffMarketReason")
        return reason

    async def resolve_code(self, code: str, tenant_id: UUID) -> OffMarketReason | None:
        """Find an active reason by code for this tenant (platform or tenant-scoped)."""
        stmt = (
            select(OffMarketReason)
            .where(
                OffMarketReason.code == code,
                OffMarketReason.active.is_(True),
                or_(
                    OffMarketReason.tenant_id.is_(None),
                    OffMarketReason.tenant_id == tenant_id,
                ),
            )
            .order_by(OffMarketReason.tenant_id.nullslast())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_reason(
        self, tenant_id: UUID, current_user: dict,
        code: str, label: str, requires_note: bool, ordering: int,
    ) -> OffMarketReason:
        self._require_admin(current_user["role"])
        await self._set_rls(tenant_id)

        existing = await self.resolve_code(code, tenant_id)
        if existing and existing.tenant_id == tenant_id:
            raise bad_request(f"Code '{code}' already exists for this tenant")

        reason = OffMarketReason(
            tenant_id=tenant_id,
            code=code,
            label=label,
            requires_note=requires_note,
            ordering=ordering,
        )
        self.session.add(reason)
        await self.session.flush()
        await self._audit.record(
            AuditAction.OFF_MARKET_REASON_CREATED, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="off_market_reason", entity_id=reason.id,
            after={"code": code, "label": label},
        )
        await self.session.refresh(reason)
        return reason

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_reason(
        self, reason_id: UUID, tenant_id: UUID, current_user: dict, updates: dict
    ) -> OffMarketReason:
        self._require_admin(current_user["role"])
        await self._set_rls(tenant_id)
        reason = await self.get_reason(reason_id, tenant_id)
        if reason.tenant_id is None:
            raise forbidden("Platform-level reasons are read-only for tenants")
        before = {"label": reason.label, "requires_note": reason.requires_note, "ordering": reason.ordering, "active": reason.active}
        for k in ("label", "requires_note", "ordering", "active"):
            if k in updates:
                setattr(reason, k, updates[k])
        await self.session.flush()
        await self._audit.record(
            AuditAction.OFF_MARKET_REASON_UPDATED, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="off_market_reason", entity_id=reason.id,
            before=before, after=updates,
        )
        await self.session.refresh(reason)
        return reason

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_reason(
        self, reason_id: UUID, tenant_id: UUID, current_user: dict
    ) -> None:
        self._require_admin(current_user["role"])
        await self._set_rls(tenant_id)
        reason = await self.get_reason(reason_id, tenant_id)
        if reason.tenant_id is None:
            raise forbidden("Platform-level reasons cannot be deleted by tenants")
        await self.session.delete(reason)
        await self.session.flush()
        await self._audit.record(
            AuditAction.OFF_MARKET_REASON_DELETED, tenant_id=tenant_id,
            actor_user_id=UUID(current_user["id"]),
            entity_type="off_market_reason", entity_id=reason_id,
            after={"code": reason.code},
        )
