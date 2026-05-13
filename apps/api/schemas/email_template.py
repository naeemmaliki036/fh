"""Pydantic schemas for EmailTemplate CRUD."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EmailTemplateCreateRequest(BaseModel):
    tenant_id: uuid.UUID | None = None
    key: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1)
    body_html: str = Field(min_length=1)
    body_text: str | None = None
    variables: dict = Field(default_factory=dict)
    active: bool = True


class EmailTemplateUpdateRequest(BaseModel):
    name: str | None = None
    subject: str | None = None
    body_html: str | None = None
    body_text: str | None = None
    variables: dict | None = None
    active: bool | None = None


class EmailTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID | None
    key: str
    name: str
    subject: str
    body_html: str
    body_text: str | None
    variables: dict
    active: bool
    created_at: datetime
    updated_at: datetime


class EmailTemplateListResponse(BaseModel):
    items: list[EmailTemplateResponse]
    total: int


class TestSendRequest(BaseModel):
    to_email: str = Field(min_length=1)
    variables: dict = Field(default_factory=dict)


class TestSendResponse(BaseModel):
    subject_rendered: str
    body_html_rendered: str
    sent: bool
