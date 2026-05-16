"""OpenHouse model — a scheduled public viewing event for a listing.

Rationale for denormalised property_id:
  The public site "upcoming open houses" card query filters on (tenant_id,
  property_id, status, starts_at) to avoid joining through listings.  The
  idx_open_houses_listing_status_starts index covers the per-listing variant.

status transitions (enforced at service layer):
  scheduled → cancelled  (agent cancels)
  scheduled → completed  (post-event batch job or manual confirmation)
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .open_house_enums import OpenHouseStatus

_ev = lambda x: [e.value for e in x]  # noqa: E731


class OpenHouse(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "open_houses"
    __table_args__ = (
        CheckConstraint("ends_at > starts_at", name="ck_open_houses_time_order"),
        CheckConstraint(
            "capacity IS NULL OR capacity > 0",
            name="ck_open_houses_capacity_positive",
        ),
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Denormalised for public-card query speed (avoids join through listings).
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # DB column is TIMESTAMPTZ — must declare timezone=True so SQLAlchemy
    # binds tz-aware datetimes (otherwise asyncpg refuses with
    # "can't subtract offset-naive and offset-aware datetimes").
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )

    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )

    # NULL = unlimited capacity.
    capacity: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
    )

    # Agent-facing context; not shown publicly.
    notes: Mapped[str | None] = mapped_column(
        Text, nullable=True,
    )

    status: Mapped[OpenHouseStatus] = mapped_column(
        Enum(OpenHouseStatus, name="open_house_status", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=OpenHouseStatus.SCHEDULED,
        server_default=OpenHouseStatus.SCHEDULED.value,
    )

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
