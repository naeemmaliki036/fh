"""Admin-facing document request schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from apps.api.models.enums import DocumentRequestStatus, PrivateDocumentKind


class DocumentRequestItemCreate(BaseModel):
    kind: PrivateDocumentKind
    label: str
    is_required: bool = True
    ordering: int = 0


class DocumentRequestCreate(BaseModel):
    customer_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    title: str
    instructions: str | None = None
    items: list[DocumentRequestItemCreate] = Field(min_length=1)
    expires_in_days: int = Field(default=7, ge=1, le=90)


class DocumentRequestItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    document_request_id: uuid.UUID
    kind: PrivateDocumentKind
    label: str
    is_required: bool
    ordering: int
    uploaded_document_id: uuid.UUID | None = None
    uploaded_at: datetime | None = None


class DocumentRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    customer_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    deal_id: uuid.UUID | None = None
    title: str
    instructions: str | None = None
    token: str
    status: DocumentRequestStatus
    expires_at: datetime
    verified_at: datetime | None = None
    verification_attempts: int
    created_by_user_id: uuid.UUID
    items: list[DocumentRequestItemResponse] = []
    items_count: int = 0
    uploaded_count: int = 0
    created_at: datetime
    updated_at: datetime


class DocumentRequestCreateResponse(DocumentRequestResponse):
    """Extends base response with one-time plaintext fields."""
    verification_code: str  # plaintext — returned only on creation
    public_url: str


class DocumentRequestListResponse(BaseModel):
    items: list[DocumentRequestResponse]
    total: int


class RegenerateCodeResponse(BaseModel):
    verification_code: str
    message: str = "Verification code regenerated. Share it with the customer."
