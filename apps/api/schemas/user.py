"""User request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from apps.api.models.enums import TenantRole, UserStatus


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: TenantRole
    phone: str | None = None


class UserUpdateRequest(BaseModel):
    """PATCH /users/{id} — admin-level update."""

    full_name: str | None = None
    phone: str | None = None
    role: TenantRole | None = None


class UserMeUpdateRequest(BaseModel):
    """PATCH /users/me — self-service update; role/email not allowed."""

    full_name: str | None = None
    phone: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    full_name: str
    role: TenantRole
    status: UserStatus
    phone: str | None = None
    created_at: datetime
    updated_at: datetime


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
