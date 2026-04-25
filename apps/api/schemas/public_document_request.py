"""Public (unauthenticated) document request schemas — minimal safe surface."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from apps.api.models.enums import DocumentRequestStatus, PrivateDocumentKind


class PublicItemResponse(BaseModel):
    id: uuid.UUID
    kind: PrivateDocumentKind
    label: str
    is_required: bool
    uploaded: bool
    uploaded_at: datetime | None = None


class PublicDocumentRequestResponse(BaseModel):
    """Safe metadata exposed to anonymous and verified public visitors.

    Deliberately excludes: customer_id, tenant_id, token, code hash, deal_id.
    """
    title: str
    instructions: str | None = None
    tenant_name: str
    status: DocumentRequestStatus
    expires_at: datetime
    verified: bool  # True when caller's Authorization JWT is valid for this request
    items: list[PublicItemResponse]


class VerifyRequest(BaseModel):
    code: str


class VerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800


class UploadItemResponse(BaseModel):
    item_id: uuid.UUID
    uploaded: bool
    uploaded_at: datetime
    request_status: DocumentRequestStatus
