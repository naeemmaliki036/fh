"""ListingPriceHistory model — immutable append-only record of listing price changes.

Every price change on a Listing row must produce a ListingPriceHistory entry.
The service layer is responsible for creating this record atomically with the
Listing price update. No updated_at — these rows are never mutated.
"""

import uuid
from datetime import datetime

from sqlalchemy import CHAR, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, UUIDMixin


class ListingPriceHistory(Base, UUIDMixin):
    __tablename__ = "listing_price_history"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    old_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    new_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    # ISO 4217 currency code — CHAR(3) matches migration DDL.
    currency: Mapped[str] = mapped_column(CHAR(3), nullable=False)

    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    reason_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        # server_default via DB column default — service must pass explicit value
        # or rely on DB now() when inserting.
    )
