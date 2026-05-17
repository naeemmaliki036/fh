"""Consumer listing schemas — create/update/response for self-posted listings."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


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
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
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
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
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


class RequestChangesBody(BaseModel):
    notes: str = Field(min_length=1, max_length=2000)


class ConsumerListingMediaItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    kind: str | None = None
    position: int = 0


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
    submitted_at: datetime | None = None
    review_notes: str | None = None
    reviewed_at: datetime | None = None
    days_until_expiry: int | None = None
    is_expired: bool = False

    # Media gallery
    media: list[ConsumerListingMediaItem] = Field(default_factory=list)

    # Property-level fields (flattened)
    property_type: str | None = None
    country: str | None = None
    city: str | None = None
    area: str | None = None
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
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


# ---------------------------------------------------------------------------
# Admin moderation schemas
# ---------------------------------------------------------------------------


class AdminConsumerListingQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    title: str
    price: float
    currency: str
    submitted_at: datetime | None = None
    created_at: datetime | None = None
    review_notes: str | None = None
    property_type: str | None = None
    city: str | None = None
    area: str | None = None
    bedrooms: int | None = None
    media_count: int = 0
    owner_email: str
    owner_name: str | None = None


class AdminConsumerListingQueueResponse(BaseModel):
    items: list[AdminConsumerListingQueueItem]
    total: int


class AdminConsumerListingDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    title: str
    description: str | None = None
    price: float
    currency: str
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None
    expires_at: datetime | None = None
    created_at: datetime | None = None
    property_type: str | None = None
    city: str | None = None
    area: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    size_sqft: float | None = None
    amenities: list[Any] = Field(default_factory=list)
    furnishing_status: str | None = None
    completion_status: str | None = None
    ownership_type: str | None = None
    media: list[ConsumerListingMediaItem] = Field(default_factory=list)
    owner_email: str
    owner_name: str | None = None
    owner_phone: str | None = None
    internal_reference: str | None = None


class ModerationActionResponse(BaseModel):
    id: UUID
    status: str
    review_notes: str | None = None


# ---------------------------------------------------------------------------
# Consumer media upload response
# ---------------------------------------------------------------------------


class ConsumerMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    kind: str | None = None
    position: int = 0
    mime_type: str | None = None
    size_bytes: int | None = None
    created_at: datetime | None = None


class ConsumerMediaListResponse(BaseModel):
    items: list[ConsumerMediaResponse]
    total: int


class ConsumerMediaReorderRequest(BaseModel):
    ordered_ids: list[UUID]
