"""Private document request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import (
    PrivateDocumentApprovalStatus,
    PrivateDocumentEntityType,
    PrivateDocumentKind,
)


class PrivateDocumentResponse(BaseModel):
    """Safe document metadata — storage_key is intentionally excluded.

    The frontend must call the /download endpoint to obtain a signed URL.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    entity_type: PrivateDocumentEntityType
    entity_id: uuid.UUID
    kind: PrivateDocumentKind
    original_filename: str
    mime_type: str
    size_bytes: int
    uploaded_by_user_id: uuid.UUID | None = None
    uploaded_by_platform_user_id: uuid.UUID | None = None
    # Approval workflow fields (migration 0037)
    approval_status: PrivateDocumentApprovalStatus = PrivateDocumentApprovalStatus.APPROVED
    approved_by_user_id: uuid.UUID | None = None
    approved_at: datetime | None = None
    rejected_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class PrivateDocumentListResponse(BaseModel):
    items: list[PrivateDocumentResponse]
    total: int


class DownloadUrlResponse(BaseModel):
    signed_url: str
    expires_in: int


class ApproveDocumentRequest(BaseModel):
    pass  # No body needed; approver identity comes from CurrentUser


class RejectDocumentRequest(BaseModel):
    reason: str  # min 5 chars validated at service layer


class PendingDocumentFilter(BaseModel):
    entity_type: PrivateDocumentEntityType | None = None
    assigned_to_me: bool = False
