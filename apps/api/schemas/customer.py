"""Customer request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from apps.api.models.enums import CustomerSource, CustomerStatus


class CustomerCreateRequest(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str  # required
    nationality: str | None = None
    language: str | None = None
    preferred_currency: str | None = None
    source: CustomerSource = CustomerSource.MANUAL
    status: CustomerStatus = CustomerStatus.ACTIVE
    notes: str | None = None
    assigned_agent_id: uuid.UUID | None = None


class CustomerUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    nationality: str | None = None
    language: str | None = None
    preferred_currency: str | None = None
    source: CustomerSource | None = None
    notes: str | None = None
    assigned_agent_id: uuid.UUID | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    full_name: str
    email: str | None = None
    phone: str | None = None
    phone_normalized: str | None = None
    nationality: str | None = None
    language: str | None = None
    preferred_currency: str | None = None
    source: CustomerSource
    status: CustomerStatus
    notes: str | None = None
    assigned_agent_id: uuid.UUID | None = None
    created_by_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int


class MergeHintResponse(BaseModel):
    """Returned as the body of a 409 when a duplicate phone_normalized is detected."""

    detail: str
    existing_customer_id: uuid.UUID
