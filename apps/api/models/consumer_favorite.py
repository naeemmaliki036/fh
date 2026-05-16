"""ConsumerFavorite model — saved listings for marketplace consumers.

Join between a consumer_account and a listing. The UNIQUE constraint
prevents duplicate saves. The index on listing_id supports fast aggregation
of favorite counts per listing (e.g. "47 people saved this").
"""

import uuid

from sqlalchemy import ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import DateTime

from packages.common.db.base import Base, UUIDMixin


class ConsumerFavorite(Base, UUIDMixin):
    """One row per (consumer, listing) saved pair."""

    __tablename__ = "consumer_favorites"

    __table_args__ = (
        UniqueConstraint(
            "consumer_account_id",
            "listing_id",
            name="uq_consumer_favorites_consumer_listing",
        ),
        Index("idx_consumer_favorites_listing", "listing_id"),
    )

    consumer_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("consumer_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
