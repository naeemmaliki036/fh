"""Listing model — public market representation of a property.

Property ≠ Listing (critical project rule):
  - Property is the internal inventory record (physical asset, compliance data).
  - Listing is the market-facing record (price, description, portal sync state).
  - A Property may have multiple Listings (e.g., simultaneously for sale and
    for long-term rent, or a re-listed property after a deal fell through).

rent_period is nullable at the DB level; the service layer must validate that
it is set when purpose is rent_short or rent_long, and NULL when purpose is sale.

portal_sync_enabled is a Phase 2 trigger flag. Backend-dev will use it to
decide whether to push this listing to configured portal connectors.
"""

import uuid

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import ListingPurpose, ListingStatus, ListingTier, RentPeriod

_ev = lambda x: [e.value for e in x]  # noqa: E731


class Listing(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "listings"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
    )

    purpose: Mapped[ListingPurpose] = mapped_column(
        Enum(ListingPurpose, name="listing_purpose", create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    # Public-facing fields — may differ from Property.title/description.
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)

    # NULL when purpose = sale; required for rent_short / rent_long.
    rent_period: Mapped[RentPeriod | None] = mapped_column(
        Enum(RentPeriod, name="rent_period", create_type=False,
             values_callable=_ev),
        nullable=True,
    )

    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=ListingStatus.DRAFT,
        server_default=ListingStatus.DRAFT.value,
    )

    listing_tier: Mapped[ListingTier] = mapped_column(
        Enum(ListingTier, name="listing_tier", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=ListingTier.STANDARD,
        server_default=ListingTier.STANDARD.value,
    )

    valid_from: Mapped[object | None] = mapped_column(Date, nullable=True)
    valid_until: Mapped[object | None] = mapped_column(Date, nullable=True)

    # Phase 2: wired to portal connector sync jobs.
    portal_sync_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
