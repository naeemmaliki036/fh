"""Tenant request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import TenantStatus


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    status: TenantStatus
    currency: str
    timezone: str
    locale: str
    approved_at: datetime | None = None
    approved_by_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class TenantUpdateRequest(BaseModel):
    """PATCH /tenants/me — only these fields are mutable by the tenant."""

    name: str | None = None
    currency: str | None = None
    timezone: str | None = None
    locale: str | None = None


class TenantListResponse(BaseModel):
    items: list[TenantResponse]
    total: int
