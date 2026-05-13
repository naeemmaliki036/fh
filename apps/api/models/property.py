"""Property model — internal inventory record.

Property ≠ Listing (critical project rule).
A Property is the physical/legal asset on file. It may have zero or many
Listings attached to it (sale listing, rental listing, etc.). Never merge
these two entities.

amenities is stored as a JSONB array of strings so the list can grow without
migrations. Examples: ["pool", "gym", "parking", "sea_view"].

Geo coordinates are plain Numeric in Phase 1. Phase 2 will add PostGIS and
a geometry column for proximity search — the lat/lng columns act as seed data
for that migration.
"""

import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, SmallInteger, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TenantMixin, TimestampMixin, UUIDMixin

from .enums import PropertyStatus, PropertyType

_ev = lambda x: [e.value for e in x]  # noqa: E731


class Property(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "properties"

    # Tenant-defined reference code (e.g. "MAR-2BR-042").
    # Partial unique index (WHERE NOT NULL) enforced in migration.
    internal_reference: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType, name="property_type", create_type=False,
             values_callable=_ev),
        nullable=False,
    )

    bedrooms: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    size_sqft: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )

    # Base asking price — listing price may differ.
    price: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    # Currency defaults to tenant.currency at service layer; not a column default.
    currency: Mapped[str | None] = mapped_column(String(8), nullable=True)

    address_line: Mapped[str | None] = mapped_column(String(512), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    area: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # ISO 3166-1 alpha-2; service layer defaults to 'AE'.
    country: Mapped[str | None] = mapped_column(String(8), nullable=True)

    # Phase 1 geo: plain coordinates. Phase 2 adds PostGIS geometry column.
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    # Array of feature strings — grows without migrations.
    amenities: Mapped[list | None] = mapped_column(
        JSONB, nullable=True, server_default="'[]'::jsonb"
    )

    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, name="property_status", create_type=False,
             values_callable=_ev),
        nullable=False,
        default=PropertyStatus.DRAFT,
        server_default=PropertyStatus.DRAFT.value,
    )

    # Freeform tags for search/filtering — e.g. ["sea_view", "ready_2025"].
    tags: Mapped[list] = mapped_column(
        ARRAY(Text),
        nullable=False,
        server_default=text("'{}'::text[]"),
    )

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
