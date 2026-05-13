"""Platform user request/response schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from apps.api.models.enums import PlatformRole, UserStatus


class PlatformUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: PlatformRole
    status: UserStatus
    email_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PlatformUserListResponse(BaseModel):
    items: list[PlatformUserResponse]
    total: int


class PlatformUserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: PlatformRole
    password: str = Field(..., min_length=8, max_length=128)


class PlatformUserUpdateRequest(BaseModel):
    """PATCH — all fields optional."""

    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    role: PlatformRole | None = None
    status: UserStatus | None = None


class PlatformUserResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
