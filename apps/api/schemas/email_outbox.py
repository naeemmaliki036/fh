"""Pydantic schemas for EmailOutbox read + action endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EmailOutboxResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID | None
    recipient_email: str
    template_key: str
    subject_rendered: str
    body_html_rendered: str
    status: str
    provider_message_id: str | None
    attempts: int
    last_error: str | None
    payload_json: dict
    queued_at: datetime
    sent_at: datetime | None


class EmailOutboxListResponse(BaseModel):
    items: list[EmailOutboxResponse]
    total: int


class ProcessOutboxResponse(BaseModel):
    attempted: int
    sent: int
    failed: int
