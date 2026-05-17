"""Property request/response schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from apps.api.models.enums import (
    CommissionType,
    CompletionStatus,
    FitOutStatus,
    FurnishingStatus,
    OwnershipType,
    PropertyStatus,
    PropertyType,
    ViewOrientation,
)


def _validate_tags(v: list[str] | None) -> list[str] | None:
    """Dedupe case-insensitively (preserve first occurrence), strip, max 5, each 1-30 chars."""
    if v is None:
        return v
    stripped = [t.strip() for t in v]
    for t in stripped:
        if not t:
            raise ValueError("Tag must not be empty after stripping whitespace")
        if len(t) > 30:
            raise ValueError(f"Tag '{t}' exceeds 30 character limit")
    seen: set[str] = set()
    deduped: list[str] = []
    for t in stripped:
        key = t.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(t)
    if len(deduped) > 5:
        raise ValueError("Maximum 5 tags allowed")
    return deduped


def _validate_amenity_keys(v: list[str] | None) -> list[str] | None:
    """Reject unknown amenity keys with a 422 listing the offenders."""
    if v is None:
        return v
    from apps.api.services.amenity_catalog import VALID_AMENITY_KEYS
    unknown = [k for k in v if k not in VALID_AMENITY_KEYS]
    if unknown:
        raise ValueError(f"Unknown amenity keys: {unknown}")
    return v


class PropertyAgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    property_id: uuid.UUID
    agent_id: uuid.UUID
    is_primary: bool
    assigned_at: datetime
    commission_override_type: CommissionType | None = None
    commission_override_value: Decimal | None = None


class CommissionOverrideRequest(BaseModel):
    commission_type: CommissionType
    commission_value: Decimal


class PropertyAgentAssignRequest(BaseModel):
    agent_id: uuid.UUID
    is_primary: bool = False


class PropertyAgentPatchRequest(BaseModel):
    is_primary: bool


class PropertyCreateRequest(BaseModel):
    title: str
    description: str | None = None
    property_type: PropertyType
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
    size_sqft: Decimal | None = None
    price: Decimal | None = None
    currency: str | None = None
    address_line: str | None = None
    city: str | None = None
    area: str | None = None
    country: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    amenities: list[str] | None = None
    internal_reference: str | None = None
    agent_ids: list[uuid.UUID] | None = None
    tags: list[str] | None = None
    # --- migration 0039 attributes ---
    furnishing_status: FurnishingStatus | None = None
    completion_status: CompletionStatus | None = None
    ownership_type: OwnershipType | None = None
    view_orientation: ViewOrientation | None = None
    service_charge_aed_sqft: Decimal | None = None
    rera_permit_number: str | None = None
    plot_area_sqft: int | None = None
    parking_spaces: int | None = None
    floor_level: str | None = None
    fit_out_status: FitOutStatus | None = None
    ceiling_height_m: Decimal | None = None
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool | None = None
    # --- migration 0040 attributes ---
    build_year: int | None = None

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        return _validate_tags(v)

    @field_validator("amenities", mode="before")
    @classmethod
    def validate_amenities(cls, v: list[str] | None) -> list[str] | None:
        return _validate_amenity_keys(v)

    @field_validator("handover_quarter", mode="before")
    @classmethod
    def validate_handover_quarter(cls, v: int | None) -> int | None:
        if v is not None and not (1 <= v <= 4):
            raise ValueError("handover_quarter must be 1–4")
        return v

    @field_validator("build_year", mode="before")
    @classmethod
    def validate_build_year(cls, v: int | None) -> int | None:
        if v is not None and not (1900 <= v <= 2100):
            raise ValueError("build_year must be between 1900 and 2100")
        return v


class PropertyUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    property_type: PropertyType | None = None
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
    size_sqft: Decimal | None = None
    price: Decimal | None = None
    currency: str | None = None
    address_line: str | None = None
    city: str | None = None
    area: str | None = None
    country: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    amenities: list[str] | None = None
    internal_reference: str | None = None
    tags: list[str] | None = None
    # --- migration 0039 attributes ---
    furnishing_status: FurnishingStatus | None = None
    completion_status: CompletionStatus | None = None
    ownership_type: OwnershipType | None = None
    view_orientation: ViewOrientation | None = None
    service_charge_aed_sqft: Decimal | None = None
    rera_permit_number: str | None = None
    plot_area_sqft: int | None = None
    parking_spaces: int | None = None
    floor_level: str | None = None
    fit_out_status: FitOutStatus | None = None
    ceiling_height_m: Decimal | None = None
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool | None = None
    # --- migration 0040 attributes ---
    build_year: int | None = None
    # status intentionally omitted — use PATCH /{id}/status (audited)

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        return _validate_tags(v)

    @field_validator("amenities", mode="before")
    @classmethod
    def validate_amenities(cls, v: list[str] | None) -> list[str] | None:
        return _validate_amenity_keys(v)

    @field_validator("handover_quarter", mode="before")
    @classmethod
    def validate_handover_quarter(cls, v: int | None) -> int | None:
        if v is not None and not (1 <= v <= 4):
            raise ValueError("handover_quarter must be 1–4")
        return v

    @field_validator("build_year", mode="before")
    @classmethod
    def validate_build_year(cls, v: int | None) -> int | None:
        if v is not None and not (1900 <= v <= 2100):
            raise ValueError("build_year must be between 1900 and 2100")
        return v


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    description: str | None = None
    property_type: PropertyType
    bedrooms: int | None = Field(default=None, ge=0, le=50)
    bathrooms: int | None = Field(default=None, ge=0, le=50)
    size_sqft: Decimal | None = None
    price: Decimal | None = None
    currency: str | None = None
    address_line: str | None = None
    city: str | None = None
    area: str | None = None
    country: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    amenities: list[str] | None = None
    internal_reference: str | None = None
    status: PropertyStatus
    tags: list[str] = []
    assigned_agents: list[PropertyAgentResponse] = []
    media_count: int = 0
    listing_count: int = 0
    thumbnail_url: str | None = None
    thumbnail_kind: str | None = None  # "image" | "video"
    first_active_listing_id: uuid.UUID | None = None
    first_active_listing_title: str | None = None
    # --- migration 0039 attributes ---
    furnishing_status: FurnishingStatus | None = None
    completion_status: CompletionStatus | None = None
    ownership_type: OwnershipType | None = None
    view_orientation: ViewOrientation | None = None
    service_charge_aed_sqft: Decimal | None = None
    rera_permit_number: str | None = None
    plot_area_sqft: int | None = None
    parking_spaces: int | None = None
    floor_level: str | None = None
    fit_out_status: FitOutStatus | None = None
    ceiling_height_m: Decimal | None = None
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool = False
    # migration 0040
    build_year: int | None = None
    created_at: datetime
    updated_at: datetime


class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
