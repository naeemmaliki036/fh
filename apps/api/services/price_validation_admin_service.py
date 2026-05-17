"""PriceValidationAdminService — platform-admin CRUD for price_validation_rules.

All audit rows use actor_platform_user_id + tenant_id=None (platform-global).
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction
from apps.api.models.price_validation_rule import PriceValidationRule
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request, not_found


def _snapshot(rule: PriceValidationRule) -> dict:
    return {
        "id": str(rule.id),
        "country": rule.country,
        "city": rule.city,
        "purpose": rule.purpose,
        "currency": rule.currency,
        "min_amount": str(rule.min_amount) if rule.min_amount is not None else None,
        "max_amount": str(rule.max_amount) if rule.max_amount is not None else None,
        "enabled": rule.enabled,
        "display_order": rule.display_order,
    }


class PriceValidationAdminService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def list_all(self) -> tuple[list[PriceValidationRule], int]:
        stmt = (
            select(PriceValidationRule)
            .order_by(
                PriceValidationRule.display_order,
                PriceValidationRule.created_at,
            )
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        return rows, len(rows)

    async def _get_or_404(self, rule_id: UUID) -> PriceValidationRule:
        rule = await self.session.get(PriceValidationRule, rule_id)
        if not rule:
            raise not_found("PriceValidationRule")
        return rule

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create(self, data: dict, actor_id: UUID) -> PriceValidationRule:
        # Auto-assign display_order if not provided.
        display_order = data.get("display_order")
        if display_order is None:
            max_order = (
                await self.session.execute(
                    select(func.max(PriceValidationRule.display_order))
                )
            ).scalar_one()
            display_order = (max_order or 0) + 10

        rule = PriceValidationRule(
            country=data.get("country"),
            city=data.get("city"),
            purpose=data.get("purpose"),
            currency=data.get("currency", "AED"),
            min_amount=data.get("min_amount"),
            max_amount=data.get("max_amount"),
            notes=data.get("notes"),
            enabled=data.get("enabled", True),
            display_order=display_order,
        )
        self.session.add(rule)
        await self.session.flush()
        await self._audit.record(
            AuditAction.PRICE_RULE_CREATED,
            tenant_id=None,
            actor_platform_user_id=actor_id,
            entity_type="price_validation_rule",
            entity_id=rule.id,
            after=_snapshot(rule),
        )
        await self.session.refresh(rule)
        return rule

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update(
        self, rule_id: UUID, updates: dict, actor_id: UUID
    ) -> PriceValidationRule:
        rule = await self._get_or_404(rule_id)
        before = {k: getattr(rule, k) for k in updates}
        for k, v in updates.items():
            setattr(rule, k, v)
        await self.session.flush()
        await self._audit.record(
            AuditAction.PRICE_RULE_UPDATED,
            tenant_id=None,
            actor_platform_user_id=actor_id,
            entity_type="price_validation_rule",
            entity_id=rule.id,
            before={
                k: str(v) if isinstance(v, Decimal) else v
                for k, v in before.items()
            },
            after={
                k: str(v) if isinstance(v, Decimal) else v
                for k, v in updates.items()
            },
        )
        await self.session.refresh(rule)
        return rule

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete(self, rule_id: UUID, actor_id: UUID) -> None:
        rule = await self._get_or_404(rule_id)
        snap = _snapshot(rule)
        await self.session.delete(rule)
        await self.session.flush()
        await self._audit.record(
            AuditAction.PRICE_RULE_DELETED,
            tenant_id=None,
            actor_platform_user_id=actor_id,
            entity_type="price_validation_rule",
            entity_id=rule_id,
            before=snap,
        )

    # ------------------------------------------------------------------
    # Reorder
    # ------------------------------------------------------------------

    async def reorder(
        self, ordered_ids: list[UUID], actor_id: UUID
    ) -> None:
        """Set display_order = (index * 10 + 10) for each id. 422 on unknown id."""
        rows: list[PriceValidationRule] = []
        for uid in ordered_ids:
            rule = await self.session.get(PriceValidationRule, uid)
            if rule is None:
                raise bad_request(f"Unknown price_validation_rule id: {uid}")
            rows.append(rule)

        for idx, rule in enumerate(rows):
            new_order = idx * 10 + 10
            old_order = rule.display_order
            rule.display_order = new_order
            await self.session.flush()
            await self._audit.record(
                AuditAction.PRICE_RULE_UPDATED,
                tenant_id=None,
                actor_platform_user_id=actor_id,
                entity_type="price_validation_rule",
                entity_id=rule.id,
                before={"display_order": old_order},
                after={"display_order": new_order},
            )
