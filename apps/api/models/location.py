"""Location models: Country, City, Area.

Platform-level reference data — no tenant_id.
Relationships:
  Country --< City --< Area
"""

from sqlalchemy import Boolean, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class Country(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "countries"

    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    currency: Mapped[str | None] = mapped_column(Text, nullable=True)
    flag_emoji: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    ordering: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    cities: Mapped[list["City"]] = relationship(
        "City", back_populates="country", cascade="all, delete-orphan",
        order_by="City.ordering",
    )


class City(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cities"

    __table_args__ = (
        UniqueConstraint("country_id", "slug", name="uq_cities_country_slug"),
    )

    country_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("countries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    ordering: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    country: Mapped["Country"] = relationship("Country", back_populates="cities")
    areas: Mapped[list["Area"]] = relationship(
        "Area", back_populates="city", cascade="all, delete-orphan",
        order_by="Area.ordering",
    )


class Area(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "areas"

    __table_args__ = (
        UniqueConstraint("city_id", "slug", name="uq_areas_city_slug"),
    )

    city_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    ordering: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    city: Mapped["City"] = relationship("City", back_populates="areas")
