"""Media request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import MediaKind


class MediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    property_id: uuid.UUID
    kind: MediaKind
    storage_key: str
    url: str  # assembled by service; not a DB column
    mime_type: str
    size_bytes: int
    ordering: int
    alt_text: str | None = None
    variants: dict | None = None
    width: int | None = None
    height: int | None = None
    uploaded_by_user_id: uuid.UUID | None = None
    # migration 0040 — floor plan flag
    is_floor_plan: bool = False
    created_at: datetime
    updated_at: datetime


class MediaListResponse(BaseModel):
    items: list[MediaResponse]
    total: int


class MediaUpdateRequest(BaseModel):
    ordering: int | None = None
    alt_text: str | None = None
    is_floor_plan: bool | None = None


class MediaReorderRequest(BaseModel):
    ordered_ids: list[uuid.UUID]
