"""Consumer auth schemas — passwordless OTP login/signup flow."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class RequestOtpRequest(BaseModel):
    email: EmailStr


class RequestOtpResponse(BaseModel):
    sent: bool
    # Only populated in non-production when CONSUMER_OTP_DEV_OVERRIDE is set.
    dev_otp: str | None = None


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str
    full_name: str | None = None
    phone: str | None = None


class ConsumerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str | None = None
    phone: str | None = None
    status: str
    created_at: datetime
    last_login_at: datetime | None = None
    listings_count: int = 0
    favorites_count: int = 0


class ConsumerAuthResponse(BaseModel):
    access_token: str
    consumer: ConsumerResponse


class ConsumerUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
