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

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import ListingPurpose, ListingStatus, ListingTier, RentPeriod

if TYPE_CHECKING:
    from .media import Media

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

    # Hero image — a pinned media record from the property's media gallery.
    # NULL until explicitly set by the listing manager.
    hero_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("media.id", ondelete="SET NULL"),
        nullable=True,
    )
    hero_media: Mapped[Media | None] = relationship(
        "Media",
        foreign_keys=[hero_media_id],
        lazy="select",
    )

    # ------------------------------------------------------------------
    # Review workflow columns (added in migration 0028)
    # ------------------------------------------------------------------
    submitted_for_review_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    submitted_for_review_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ------------------------------------------------------------------
    # Short description (added in migration 0029)
    # ------------------------------------------------------------------
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
