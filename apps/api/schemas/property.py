"""Property request/response schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import PropertyStatus, PropertyType


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
    status: PropertyStatus | None = None


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
    assigned_agents: list[PropertyAgentResponse] = []
    media_count: int = 0
    listing_count: int = 0
    created_at: datetime
    updated_at: datetime


class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
