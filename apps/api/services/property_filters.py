"""Property query filter helpers — extracted from PropertyService.

apply_property_attribute_filters() is a pure function that appends the
migration-0039 + migration-0040 structured column filters to a Property SELECT.
"""

from __future__ import annotations

from sqlalchemy import exists, select

from apps.api.models.listing import Listing
from apps.api.models.media import Media
from apps.api.models.property import Property


def apply_property_attribute_filters(
    stmt,
    *,
    amenities: list[str] | None = None,
    furnishing_status: str | None = None,
    completion_status: str | None = None,
    ownership_type: str | None = None,
    view_orientation: str | None = None,
    fit_out_status: str | None = None,
    min_service_charge_aed_sqft: float | None = None,
    max_service_charge_aed_sqft: float | None = None,
    min_plot_area_sqft: int | None = None,
    max_plot_area_sqft: int | None = None,
    min_parking_spaces: int | None = None,
    has_payment_plan: bool | None = None,
    handover_year: int | None = None,
    # --- migration 0040 filters ---
    min_build_year: int | None = None,
    max_build_year: int | None = None,
    listing_verified: bool | None = None,
    has_floor_plan: bool | None = None,
):
    """Append migration-0039 attribute WHERE clauses to a Property SELECT statement.

    Amenities filter uses JSONB containment (@>) so ALL requested amenity keys
    must be present in the property's amenities array.
    """
    if amenities:
        stmt = stmt.where(Property.amenities.contains(amenities))
    if furnishing_status:
        stmt = stmt.where(Property.furnishing_status == furnishing_status)
    if completion_status:
        stmt = stmt.where(Property.completion_status == completion_status)
    if ownership_type:
        stmt = stmt.where(Property.ownership_type == ownership_type)
    if view_orientation:
        stmt = stmt.where(Property.view_orientation == view_orientation)
    if fit_out_status:
        stmt = stmt.where(Property.fit_out_status == fit_out_status)
    if min_service_charge_aed_sqft is not None:
        stmt = stmt.where(Property.service_charge_aed_sqft >= min_service_charge_aed_sqft)
    if max_service_charge_aed_sqft is not None:
        stmt = stmt.where(Property.service_charge_aed_sqft <= max_service_charge_aed_sqft)
    if min_plot_area_sqft is not None:
        stmt = stmt.where(Property.plot_area_sqft >= min_plot_area_sqft)
    if max_plot_area_sqft is not None:
        stmt = stmt.where(Property.plot_area_sqft <= max_plot_area_sqft)
    if min_parking_spaces is not None:
        stmt = stmt.where(Property.parking_spaces >= min_parking_spaces)
    if has_payment_plan is not None:
        stmt = stmt.where(Property.payment_plan.is_(has_payment_plan))
    if handover_year is not None:
        stmt = stmt.where(Property.handover_year == handover_year)

    # --- migration 0040 filters ---
    if min_build_year is not None:
        stmt = stmt.where(Property.build_year >= min_build_year)
    if max_build_year is not None:
        stmt = stmt.where(Property.build_year <= max_build_year)
    if listing_verified is True:
        stmt = stmt.where(
            exists(
                select(Listing.id).where(
                    Listing.property_id == Property.id,
                    Listing.is_verified.is_(True),
                    Listing.status == "active",
                )
            )
        )
    elif listing_verified is False:
        stmt = stmt.where(
            ~exists(
                select(Listing.id).where(
                    Listing.property_id == Property.id,
                    Listing.is_verified.is_(True),
                    Listing.status == "active",
                )
            )
        )
    if has_floor_plan is True:
        stmt = stmt.where(
            exists(
                select(Media.id).where(
                    Media.property_id == Property.id,
                    Media.is_floor_plan.is_(True),
                )
            )
        )
    elif has_floor_plan is False:
        stmt = stmt.where(
            ~exists(
                select(Media.id).where(
                    Media.property_id == Property.id,
                    Media.is_floor_plan.is_(True),
                )
            )
        )
    return stmt
