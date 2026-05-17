"""PriceValidationService — enforce platform price floors/ceilings.

Resolution order (most-specific wins for error messaging):
  1. Matching rules collected by SQL (country/city/purpose/currency wildcards).
  2. Effective min = MAX of all matching min_amounts.
  3. Effective max = MIN of all matching max_amounts.
  4. Friendly error message uses the tightest bound's rule scope.

Audit: every violated attempt writes a PRICE_VALIDATION_FAILED row so
platform admins can debug "why is this price being rejected".
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.enums import AuditAction
from apps.api.models.price_validation_rule import PriceValidationRule
from apps.api.services.audit_service import AuditService
from apps.api.services.base import BaseService
from packages.common.utils.error_handlers import bad_request


def _fmt_amount(amount: Decimal, currency: str) -> str:
    """Human-readable: 'AED 100,000'."""
    return f"{currency} {int(amount):,}"


def _scope_label(
    country: str | None,
    city: str | None,
    purpose: str | None,
) -> str:
    """Build human-readable scope prefix like 'Sale price in Dubai (UAE)'."""
    purpose_map = {
        "sale": "Sale price",
        "rent_long": "Long-term rent",
        "rent_short": "Short-term rent",
    }
    label = purpose_map.get(purpose or "", "Price") if purpose else "Price"

    if city and country:
        return f"{label} in {city} ({country})"
    if country:
        return f"{label} in {country}"
    return label


class PriceValidationService(BaseService):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)
        self._audit = AuditService(session)

    # ------------------------------------------------------------------
    # Core validate
    # ------------------------------------------------------------------

    async def validate(
        self,
        *,
        country: str | None,
        city: str | None,
        purpose: str | None,
        currency: str,
        amount: Decimal,
        actor_user_id: UUID | None = None,
    ) -> None:
        """Raise bad_request (422-compatible) if amount violates any rule.

        Effective min = MAX(matching min_amounts).
        Effective max = MIN(matching max_amounts).
        Writes an audit row on violation.
        """
        rules = await self._fetch_matching(
            country=country, city=city, purpose=purpose, currency=currency
        )
        if not rules:
            return

        eff_min: Decimal | None = None
        eff_min_rule: PriceValidationRule | None = None
        eff_max: Decimal | None = None
        eff_max_rule: PriceValidationRule | None = None

        for rule in rules:
            if rule.min_amount is not None:
                if eff_min is None or rule.min_amount > eff_min:
                    eff_min = rule.min_amount
                    eff_min_rule = rule
            if rule.max_amount is not None:
                if eff_max is None or rule.max_amount < eff_max:
                    eff_max = rule.max_amount
                    eff_max_rule = rule

        violation: str | None = None
        violated_rule: PriceValidationRule | None = None

        if eff_min is not None and amount < eff_min:
            r = eff_min_rule  # type: ignore[assignment]
            scope = _scope_label(r.country, r.city, r.purpose or purpose)
            violation = (
                f"{scope} must be at least "
                f"{_fmt_amount(eff_min, currency)}."
            )
            violated_rule = r

        elif eff_max is not None and amount > eff_max:
            r = eff_max_rule  # type: ignore[assignment]
            scope = _scope_label(r.country, r.city, r.purpose or purpose)
            violation = (
                f"{scope} cannot exceed "
                f"{_fmt_amount(eff_max, currency)}."
            )
            violated_rule = r

        if violation:
            await self._audit.record(
                AuditAction.PRICE_VALIDATION_FAILED,
                tenant_id=None,
                actor_user_id=actor_user_id,
                entity_type="price_validation_rule",
                entity_id=violated_rule.id if violated_rule else None,
                after={
                    "country": country,
                    "city": city,
                    "purpose": purpose,
                    "currency": currency,
                    "amount": str(amount),
                    "rule_id": str(violated_rule.id) if violated_rule else None,
                    "reason": violation,
                },
            )
            raise bad_request(violation)

    # ------------------------------------------------------------------
    # Preview (admin UI)
    # ------------------------------------------------------------------

    async def preview(
        self,
        *,
        country: str | None,
        city: str | None,
        purpose: str | None,
        currency: str,
    ) -> dict:
        """Return effective min/max + contributing rule sources.

        Used by the admin UI to sanity-check rule configuration.
        """
        rules = await self._fetch_matching(
            country=country, city=city, purpose=purpose, currency=currency
        )

        eff_min: Decimal | None = None
        eff_max: Decimal | None = None
        sources: list[dict] = []

        for rule in rules:
            entry: dict = {
                "rule_id": str(rule.id),
                "country": rule.country,
                "city": rule.city,
                "purpose": rule.purpose,
                "currency": rule.currency,
                "min_amount": str(rule.min_amount) if rule.min_amount is not None else None,
                "max_amount": str(rule.max_amount) if rule.max_amount is not None else None,
            }
            sources.append(entry)
            if rule.min_amount is not None:
                if eff_min is None or rule.min_amount > eff_min:
                    eff_min = rule.min_amount
            if rule.max_amount is not None:
                if eff_max is None or rule.max_amount < eff_max:
                    eff_max = rule.max_amount

        return {
            "effective_min_amount": str(eff_min) if eff_min is not None else None,
            "effective_max_amount": str(eff_max) if eff_max is not None else None,
            "currency": currency,
            "sources": sources,
        }

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _fetch_matching(
        self,
        *,
        country: str | None,
        city: str | None,
        purpose: str | None,
        currency: str,
    ) -> list[PriceValidationRule]:
        """Fetch all enabled rules that match the given scope parameters.

        SQL wildcards: NULL column = matches any value.
        """
        stmt = select(PriceValidationRule).where(
            PriceValidationRule.enabled.is_(True),
            PriceValidationRule.currency == currency,
        )

        # country: rule.country IS NULL  OR  rule.country = :country
        if country is not None:
            from sqlalchemy import or_, null
            stmt = stmt.where(
                or_(
                    PriceValidationRule.country.is_(None),
                    PriceValidationRule.country == country,
                )
            )
        else:
            stmt = stmt.where(PriceValidationRule.country.is_(None))

        # city: rule.city IS NULL  OR  lower(rule.city) = lower(:city)
        if city is not None:
            from sqlalchemy import func, or_
            stmt = stmt.where(
                or_(
                    PriceValidationRule.city.is_(None),
                    func.lower(PriceValidationRule.city) == city.lower(),
                )
            )
        else:
            stmt = stmt.where(PriceValidationRule.city.is_(None))

        # purpose: rule.purpose IS NULL  OR  rule.purpose = :purpose
        if purpose is not None:
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    PriceValidationRule.purpose.is_(None),
                    PriceValidationRule.purpose == purpose,
                )
            )
        else:
            stmt = stmt.where(PriceValidationRule.purpose.is_(None))

        rows = (await self.session.execute(stmt)).scalars().all()
        return list(rows)

    # ------------------------------------------------------------------
    # Admin CRUD helpers (called from PriceValidationAdminService)
    # ------------------------------------------------------------------

    async def get_or_404(self, rule_id: UUID) -> PriceValidationRule:
        rule = await self.session.get(PriceValidationRule, rule_id)
        from packages.common.utils.error_handlers import not_found
        if not rule:
            raise not_found("PriceValidationRule")
        return rule
