"""MarketplaceCountry model.

Platform-admin-managed catalog of countries shown in the marketplace country
gate and selector. No tenant_id — this is platform-global data.
"""

from sqlalchemy import Boolean, CheckConstraint, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class MarketplaceCountry(Base, UUIDMixin, TimestampMixin):
    """One row per ISO-3166 alpha-2 country surfaced in the marketplace."""

    __tablename__ = "marketplace_countries"

    __table_args__ = (
        CheckConstraint(
            "code ~ '^[A-Z]{2}$'",
            name="ck_marketplace_countries_code_format",
        ),
        Index(
            "idx_marketplace_countries_enabled_order",
            "enabled",
            "display_order",
        ),
    )

    code: Mapped[str] = mapped_column(
        String(2), nullable=False, unique=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    flag_emoji: Mapped[str] = mapped_column(String(8), nullable=False)
    display_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=100, server_default="100"
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
