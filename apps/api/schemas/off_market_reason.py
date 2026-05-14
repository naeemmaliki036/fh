"""Off-market reason request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OffMarketReasonCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9_-]+$")
    label: str = Field(min_length=1, max_length=128)
    requires_note: bool = False
    ordering: int = 0


class OffMarketReasonUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=128)
    requires_note: bool | None = None
    ordering: int | None = None
    active: bool | None = None


class OffMarketReasonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    code: str
    label: str
    requires_note: bool
    ordering: int
    active: bool
    created_at: datetime
    updated_at: datetime
