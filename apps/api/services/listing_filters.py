"""Listing query filter helpers — extracted from ListingService to stay under 300 LOC.

apply_listing_filters() is a pure function — it takes a SQLAlchemy select statement
and appends WHERE/JOIN clauses based on the provided filter kwargs.
"""

from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB

from apps.api.models.enums import ListingPurpose, ListingStatus, ListingTier, PropertyType
from apps.api.models.listing import Listing
from apps.api.models.property import Property
from apps.api.models.property_agent import PropertyAgent


def apply_listing_filters(  # noqa: PLR0913
    stmt,
    *,
    assigned_agent_id: UUID | None,
    assigned_reviewer_id: UUID | None,
    status: ListingStatus | None,
    purpose: ListingPurpose | None,
    listing_tier: ListingTier | None,
    min_price: float | None,
    max_price: float | None,
    currency: str | None,
    country: str | None,
    city: str | None,
    area: str | None,
    created_from,
    created_to,
    valid_from_to,
    valid_until_from,
    q: str | None,
    # --- migration 0039 property-attribute filters ---
    property_type: PropertyType | None = None,
    min_bedrooms: int | None = None,
    max_bedrooms: int | None = None,
    min_bathrooms: int | None = None,
    max_bathrooms: int | None = None,
    amenities: list[str] | None = None,
    furnishing_status: str | None = None,
    completion_status: str | None = None,
    view_orientation: str | None = None,
):
    """Append optional filter clauses to a Listing SELECT statement.

    Returns the augmented statement. Handles Property JOIN de-duplication
    (only joins once when both agent and location filters are active).
    """
    property_joined = False

    if assigned_agent_id is not None:
        stmt = (stmt
                .join(Property, Listing.property_id == Property.id)
                .join(PropertyAgent,
                      (PropertyAgent.property_id == Property.id)
                      & (PropertyAgent.agent_id == assigned_agent_id)))
        property_joined = True

    if assigned_reviewer_id is not None:
        stmt = stmt.where(Listing.assigned_reviewer_id == assigned_reviewer_id)
    if status:
        stmt = stmt.where(Listing.status == status)
    if purpose:
        stmt = stmt.where(Listing.purpose == purpose)
    if listing_tier:
        stmt = stmt.where(Listing.listing_tier == listing_tier)
    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if currency:
        stmt = stmt.where(Listing.currency == currency.upper())

    # Determine if we need the Property join for any filter below.
    needs_property = bool(
        country or city or area or property_type or
        min_bedrooms is not None or max_bedrooms is not None or
        min_bathrooms is not None or max_bathrooms is not None or
        amenities or furnishing_status or completion_status or view_orientation
    )
    if needs_property and not property_joined:
        stmt = stmt.join(Property, Listing.property_id == Property.id)
        property_joined = True  # noqa: F841 — used above

    if country:
        stmt = stmt.where(Property.country.ilike(f"%{country}%"))
    if city:
        stmt = stmt.where(Property.city.ilike(f"%{city}%"))
    if area:
        stmt = stmt.where(Property.area.ilike(f"%{area}%"))

    # --- migration 0039 property-attribute filters ---
    if property_type:
        stmt = stmt.where(Property.property_type == property_type)
    if min_bedrooms is not None:
        stmt = stmt.where(Property.bedrooms >= min_bedrooms)
    if max_bedrooms is not None:
        stmt = stmt.where(Property.bedrooms <= max_bedrooms)
    if min_bathrooms is not None:
        stmt = stmt.where(Property.bathrooms >= min_bathrooms)
    if max_bathrooms is not None:
        stmt = stmt.where(Property.bathrooms <= max_bathrooms)
    if amenities:
        stmt = stmt.where(
            Property.amenities.op("@>")(cast(json.dumps(amenities), JSONB))
        )
    if furnishing_status:
        stmt = stmt.where(Property.furnishing_status == furnishing_status)
    if completion_status:
        stmt = stmt.where(Property.completion_status == completion_status)
    if view_orientation:
        stmt = stmt.where(Property.view_orientation == view_orientation)

    if created_from:
        stmt = stmt.where(Listing.created_at >= created_from)
    if created_to:
        stmt = stmt.where(Listing.created_at <= created_to)
    if valid_from_to:
        stmt = stmt.where(Listing.valid_from <= valid_from_to)
    if valid_until_from:
        stmt = stmt.where(Listing.valid_until >= valid_until_from)
    if q:
        stmt = stmt.where(Listing.title.ilike(f"%{q}%"))

    return stmt
