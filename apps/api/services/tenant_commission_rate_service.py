"""Service for per-tenant company commission rates.

One row per (tenant_id, transaction_type). Rows auto-created on first list if
seeding was skipped. All writes emit an AuditLog entry in the same transaction.
"""

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.audit_log import AuditLog
from apps.api.models.enums import (
    AuditAction,
    CommissionRateTransactionType,
    TenantRole,
)
from apps.api.models.tenant_commission_rate import TenantCommissionRate
from apps.api.models.user import User
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, forbidden

_WRITE_ROLES = {
    TenantRole.COMPANY_OWNER.value,
    TenantRole.COMPANY_ADMIN.value,
    TenantRole.FINANCE_USER.value,
}

_DEFAULTS: dict[CommissionRateTransactionType, Decimal] = {
    CommissionRateTransactionType.SALE: Decimal("0.0200"),
    CommissionRateTransactionType.RENT_LONG: Decimal("0.0500"),
    CommissionRateTransactionType.RENT_SHORT: Decimal("0.1000"),
    CommissionRateTransactionType.OFF_PLAN: Decimal("0.0300"),
}

_RATE_MIN = Decimal("0.001")
_RATE_MAX = Decimal("0.10")


class TenantCommissionRateService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _require_write_role(self, role: str) -> None:
        if role not in _WRITE_ROLES:
            raise forbidden(
                "company_owner, company_admin, or finance_user required"
            )

    def _validate_rate(self, rate: Decimal) -> None:
        if rate < _RATE_MIN or rate > _RATE_MAX:
            raise bad_request("Commission rate must be between 0.1% and 10%")

    async def _ensure_all_rows(self, tenant_id: UUID) -> None:
        """Insert any missing default rows for this tenant (idempotent)."""
        existing_stmt = select(TenantCommissionRate.transaction_type).where(
            TenantCommissionRate.tenant_id == tenant_id
        )
        result = await self.session.execute(existing_stmt)
        existing_types = {row[0] for row in result.fetchall()}

        missing = [t for t in CommissionRateTransactionType if t not in existing_types]
        if not missing:
            return

        for tx_type in missing:
            row = TenantCommissionRate(
                tenant_id=tenant_id,
                transaction_type=tx_type,
                rate=_DEFAULTS[tx_type],
            )
            self.session.add(row)
        await self.session.flush()

    async def _get_rate_row(
        self, tenant_id: UUID, transaction_type: CommissionRateTransactionType
    ) -> TenantCommissionRate | None:
        stmt = select(TenantCommissionRate).where(
            TenantCommissionRate.tenant_id == tenant_id,
            TenantCommissionRate.transaction_type == transaction_type,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def _lookup_user_email(self, user_id: UUID | None) -> str | None:
        if user_id is None:
            return None
        result = await self.session.execute(
            select(User.email).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    def _row_to_dict(self, row: TenantCommissionRate) -> dict:
        return {
            "id": str(row.id),
            "tenant_id": str(row.tenant_id),
            "transaction_type": row.transaction_type.value,
            "rate": str(row.rate),
            "notes": row.notes,
            "updated_by_user_id": str(row.updated_by_user_id) if row.updated_by_user_id else None,
            "updated_by_user_email": None,  # caller enriches if needed
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def list_rates(self, tenant_id: UUID) -> dict:
        """Return all 4 rate rows for the tenant, auto-creating missing ones."""
        await self._ensure_all_rows(tenant_id)
        stmt = select(TenantCommissionRate).where(
            TenantCommissionRate.tenant_id == tenant_id
        ).order_by(TenantCommissionRate.transaction_type)
        result = await self.session.execute(stmt)
        rows = list(result.scalars().all())

        items = []
        for row in rows:
            email = await self._lookup_user_email(row.updated_by_user_id)
            d = self._row_to_dict(row)
            d["updated_by_user_email"] = email
            items.append(d)
        return {"items": items}

    async def update_rate(
        self,
        tenant_id: UUID,
        transaction_type: CommissionRateTransactionType,
        rate: Decimal,
        notes: str | None,
        current_user_id: UUID,
        role: str,
    ) -> dict:
        """Upsert a rate row, emit audit log, return updated dict."""
        self._require_write_role(role)
        self._validate_rate(rate)

        existing = await self._get_rate_row(tenant_id, transaction_type)

        if existing is None:
            # Create
            row = TenantCommissionRate(
                tenant_id=tenant_id,
                transaction_type=transaction_type,
                rate=rate,
                notes=notes,
                updated_by_user_id=current_user_id,
            )
            self.session.add(row)
            await self.session.flush()
            await self._audit.record(
                AuditAction.TENANT_COMMISSION_RATE_CREATED,
                tenant_id=tenant_id,
                actor_user_id=current_user_id,
                entity_type="tenant_commission_rate",
                entity_id=row.id,
                before=None,
                after={"transaction_type": transaction_type.value, "rate": str(rate), "notes": notes},
            )
            await self.session.refresh(row)
        else:
            # Update
            before = {"rate": str(existing.rate), "notes": existing.notes}
            existing.rate = rate
            existing.notes = notes
            existing.updated_by_user_id = current_user_id
            existing.updated_at = datetime.now(UTC)
            await self.session.flush()
            await self._audit.record(
                AuditAction.TENANT_COMMISSION_RATE_UPDATED,
                tenant_id=tenant_id,
                actor_user_id=current_user_id,
                entity_type="tenant_commission_rate",
                entity_id=existing.id,
                before=before,
                after={"transaction_type": transaction_type.value, "rate": str(rate), "notes": notes},
            )
            await self.session.refresh(existing)
            row = existing

        email = await self._lookup_user_email(current_user_id)
        result = self._row_to_dict(row)
        result["updated_by_user_email"] = email
        return result

    async def get_audit_log(
        self,
        tenant_id: UUID,
        transaction_type: CommissionRateTransactionType,
        limit: int = 50,
    ) -> list[dict]:
        """Return audit entries for the given tenant + transaction_type, newest first."""
        stmt = (
            select(AuditLog)
            .where(
                AuditLog.tenant_id == tenant_id,
                AuditLog.entity_type == "tenant_commission_rate",
                AuditLog.action.in_([
                    AuditAction.TENANT_COMMISSION_RATE_CREATED,
                    AuditAction.TENANT_COMMISSION_RATE_UPDATED,
                ]),
            )
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        logs = list(result.scalars().all())

        # Filter by transaction_type embedded in metadata_after
        logs = [
            log for log in logs
            if (log.metadata_after or {}).get("transaction_type") == transaction_type.value
        ]

        actor_ids = {log.actor_user_id for log in logs if log.actor_user_id}
        actor_emails: dict[UUID, str] = {}
        if actor_ids:
            u_result = await self.session.execute(
                select(User.id, User.email).where(User.id.in_(actor_ids))
            )
            for uid, email in u_result.fetchall():
                actor_emails[uid] = email

        entries = []
        for log in logs:
            entries.append({
                "id": log.id,
                "action": log.action.value,
                "actor_user_id": log.actor_user_id,
                "actor_user_email": actor_emails.get(log.actor_user_id) if log.actor_user_id else None,
                "before_value": log.metadata_before,
                "after_value": log.metadata_after,
                "occurred_at": log.created_at,
            })
        return entries
