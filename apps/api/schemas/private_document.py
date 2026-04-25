"""Private document request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import PrivateDocumentEntityType, PrivateDocumentKind


class PrivateDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    entity_type: PrivateDocumentEntityType
    entity_id: uuid.UUID
    kind: PrivateDocumentKind
    storage_key: str
    original_filename: str
    mime_type: str
    size_bytes: int
    uploaded_by_user_id: uuid.UUID | None = None
    uploaded_by_platform_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class PrivateDocumentListResponse(BaseModel):
    items: list[PrivateDocumentResponse]
    total: int


class DownloadUrlResponse(BaseModel):
    signed_url: str
    expires_in: int
