"""Open house request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from apps.api.models.open_house_enums import OpenHouseStatus


class OpenHouseCreate(BaseModel):
    starts_at: datetime
    ends_at: datetime
    capacity: int | None = Field(default=None, ge=1)
    notes: str | None = None


class OpenHouseUpdate(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    capacity: int | None = Field(default=None, ge=1)
    notes: str | None = None


class OpenHouseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID
    property_id: uuid.UUID
    tenant_id: uuid.UUID
    starts_at: datetime
    ends_at: datetime
    capacity: int | None = None
    notes: str | None = None
    status: OpenHouseStatus
    created_by_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class OpenHouseListResponse(BaseModel):
    items: list[OpenHouseResponse]
    total: int


class OpenHouseCancelRequest(BaseModel):
    reason: str | None = None
