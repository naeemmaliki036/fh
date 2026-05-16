"""Consumer listing schemas — create/update/response for self-posted listings."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ConsumerListingCreateRequest(BaseModel):
    # Core listing fields
    purpose: str
    price: float
    currency: str = "AED"
    title: str
    description: str | None = None

    # Property identity
    property_type: str

    # Location
    country: str = "AE"
    city: str | None = None
    area: str | None = None

    # Physical attributes
    bedrooms: int | None = None
    bathrooms: int | None = None
    size_sqft: float | None = None
    latitude: float | None = None
    longitude: float | None = None

    # Amenities (free-form list)
    amenities: list[str] | None = None

    # Structured attributes
    furnishing_status: str | None = None
    completion_status: str | None = None
    ownership_type: str | None = None
    view_orientation: str | None = None
    parking_spaces: int | None = None
    floor_level: str | None = None

    # Off-plan fields
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool = False
    build_year: int | None = None


class ConsumerListingUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    currency: str | None = None
    city: str | None = None
    area: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    size_sqft: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    amenities: list[str] | None = None
    furnishing_status: str | None = None
    completion_status: str | None = None
    ownership_type: str | None = None
    view_orientation: str | None = None
    parking_spaces: int | None = None
    floor_level: str | None = None
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool | None = None
    build_year: int | None = None


class MarkStatusRequest(BaseModel):
    status: str  # sold | rented | paused | active


class ConsumerListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Listing-level fields
    id: UUID
    status: str
    purpose: str
    title: str
    description: str | None = None
    price: float
    currency: str
    created_at: datetime
    updated_at: datetime | None = None
    expires_at: datetime | None = None
    days_until_expiry: int | None = None
    is_expired: bool = False

    # Property-level fields (flattened)
    property_type: str | None = None
    country: str | None = None
    city: str | None = None
    area: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    size_sqft: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    amenities: list[Any] | None = None
    furnishing_status: str | None = None
    completion_status: str | None = None
    ownership_type: str | None = None
    view_orientation: str | None = None
    parking_spaces: int | None = None
    floor_level: str | None = None
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool = False
    build_year: int | None = None
    internal_reference: str | None = None


class ConsumerListingListResponse(BaseModel):
    items: list[ConsumerListingResponse]
    total: int
    active_count: int
