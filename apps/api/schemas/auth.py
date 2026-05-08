"""Auth request/response schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterTenantRequest(BaseModel):
    # Tenant fields
    tenant_name: str
    tenant_slug: str
    currency: str = "AED"
    timezone: str = "Asia/Dubai"
    locale: str = "en"
    # Public contact details — stored on the Tenant row, not the owner's profile.
    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=5, max_length=32)
    # Owner fields
    owner_email: EmailStr
    owner_password: str
    owner_full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PlatformLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    status: str
    currency: str
    timezone: str
    locale: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    status: str


class RegisterTenantResponse(BaseModel):
    tenant: TenantResponse
    user: UserResponse
    message: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class PlatformLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class MeResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_platform: bool
    tenant_id: str | None = None
