"""Property request/response schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from apps.api.models.enums import PropertyStatus, PropertyType


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
    # dedupe: preserve first occurrence, case-insensitive
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


class PropertyAgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    property_id: uuid.UUID
    agent_id: uuid.UUID
    is_primary: bool
    assigned_at: datetime


class PropertyAgentAssignRequest(BaseModel):
    agent_id: uuid.UUID
    is_primary: bool = False


class PropertyAgentPatchRequest(BaseModel):
    is_primary: bool


class PropertyCreateRequest(BaseModel):
    title: str
    description: str | None = None
    property_type: PropertyType
    bedrooms: int | None = None
    bathrooms: int | None = None
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

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        return _validate_tags(v)


class PropertyUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    property_type: PropertyType | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
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
    # status intentionally omitted — use PATCH /{id}/status (audited)

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        return _validate_tags(v)


class PropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    description: str | None = None
    property_type: PropertyType
    bedrooms: int | None = None
    bathrooms: int | None = None
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
    created_at: datetime
    updated_at: datetime


class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
