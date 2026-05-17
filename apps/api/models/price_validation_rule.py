"""PriceValidationRule model — platform-global price floor/ceiling rules.

No tenant_id: rules are platform-wide and apply across all tenants.
Scope hierarchy: global → country → country+city → any with purpose filter.
"""

from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class PriceValidationRule(Base, UUIDMixin, TimestampMixin):
    """One row = one price bound for a (country, city, purpose, currency) scope."""

    __tablename__ = "price_validation_rules"

    __table_args__ = (
        CheckConstraint(
            "min_amount IS NOT NULL OR max_amount IS NOT NULL",
            name="ck_price_rules_one_bound",
        ),
        CheckConstraint(
            "min_amount IS NULL OR max_amount IS NULL OR max_amount >= min_amount",
            name="ck_price_rules_range",
        ),
        CheckConstraint(
            "country IS NULL OR country ~ '^[A-Z]{2}$'",
            name="ck_price_rules_country_iso2",
        ),
        CheckConstraint(
            "purpose IS NULL OR purpose IN ('sale','rent_long','rent_short')",
            name="ck_price_rules_purpose_value",
        ),
        Index(
            "idx_price_rules_lookup",
            "enabled",
            "country",
            text("lower(city)"),
            "purpose",
            "currency",
        ),
        Index("idx_price_rules_order", "display_order"),
    )

    # NULL = wildcard / matches all values at this scope level.
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(32), nullable=True)

    currency: Mapped[str] = mapped_column(
        String(8), nullable=False, server_default="AED"
    )
    min_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    max_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=100, server_default="100"
    )
