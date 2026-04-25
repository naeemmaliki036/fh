"""Agent request/response schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr

from apps.api.models.enums import AgentStatus, CommissionType


class AgentCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    license_id: str | None = None
    license_expiry_at: date | None = None
    default_commission_type: CommissionType = CommissionType.PERCENTAGE
    default_commission_value: Decimal = Decimal("0")
    linked_user_id: uuid.UUID | None = None


class AgentUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    license_id: str | None = None
    license_expiry_at: date | None = None
    default_commission_type: CommissionType | None = None
    default_commission_value: Decimal | None = None
    linked_user_id: uuid.UUID | None = None


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    full_name: str
    email: str
    phone: str | None = None
    photo_key: str | None = None
    photo_url: str | None = None  # assembled by service; not a DB column
    license_id: str | None = None
    license_expiry_at: date | None = None
    status: AgentStatus
    default_commission_type: CommissionType
    default_commission_value: Decimal
    linked_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class AgentListResponse(BaseModel):
    items: list[AgentResponse]
    total: int


class PhotoUploadResponse(BaseModel):
    photo_key: str
    url: str
