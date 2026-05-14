"""Tenant request/response schemas."""

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from apps.api.models.enums import PropertiesViewMode, TenantStatus
from apps.api.schemas.audit import AuditLogResponse

# ISO 3166-1 alpha-2 pattern
_COUNTRY_RE = re.compile(r"^[A-Z]{2}$")


def _validate_countries(v: list[str]) -> list[str]:
    if not v:
        raise ValueError("operating_countries must have at least 1 entry")
    if len(v) > 20:
        raise ValueError("operating_countries may not exceed 20 entries")
    normalized = []
    seen: set[str] = set()
    for code in v:
        upper = code.upper()
        if not _COUNTRY_RE.match(upper):
            raise ValueError(
                f"'{code}' is not a valid ISO 3166-1 alpha-2 country code (2 uppercase letters)"
            )
        if upper in seen:
            raise ValueError(f"Duplicate country code: '{upper}'")
        seen.add(upper)
        normalized.append(upper)
    return normalized


# ---------------------------------------------------------------------------
# Standard tenant response
# ---------------------------------------------------------------------------


# Floors shared between schema validators and service-layer checks.
MEDIA_LIMITS_FLOOR = {
    "max_images_per_property": 20,
    "max_videos_per_property": 2,
    "max_image_mb": 10,
    "max_video_mb": 25,
}


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    status: TenantStatus
    currency: str
    timezone: str
    locale: str
    default_properties_view: PropertiesViewMode
    operating_countries: list[str] = Field(default_factory=lambda: ["AE"])
    contact_email: str
    contact_phone: str
    public_site_enabled: bool
    approved_at: datetime | None = None
    approved_by_id: uuid.UUID | None = None
    suspended_at: datetime | None = None
    suspended_reason: str | None = None
    suspended_by_platform_user_id: uuid.UUID | None = None
    # Media caps
    max_images_per_property: int = 20
    max_videos_per_property: int = 2
    max_image_mb: int = 10
    max_video_mb: int = 25
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Tenant update (self-service)
# ---------------------------------------------------------------------------


class TenantUpdateRequest(BaseModel):
    """PATCH /tenants/me — only these fields are mutable by the tenant."""

    name: str | None = None
    currency: str | None = None
    timezone: str | None = None
    locale: str | None = None
    default_properties_view: PropertiesViewMode | None = None
    operating_countries: list[str] | None = None

    @field_validator("operating_countries", mode="before")
    @classmethod
    def _validate_countries(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        return _validate_countries(v)


# ---------------------------------------------------------------------------
# Tenant list
# ---------------------------------------------------------------------------


class TenantListResponse(BaseModel):
    items: list[TenantResponse]
    total: int


# ---------------------------------------------------------------------------
# Suspension / approval action bodies
# ---------------------------------------------------------------------------


class TenantSuspendRequest(BaseModel):
    reason_note: str = Field(..., min_length=1, max_length=1000)


class TenantReactivateRequest(BaseModel):
    reason_note: str | None = Field(default=None, max_length=1000)


class TenantApproveRequest(BaseModel):
    """No body fields required — kept for future extensibility."""


class TenantRejectRequest(BaseModel):
    reason_note: str = Field(..., min_length=1, max_length=1000)


class TenantMediaLimitsRequest(BaseModel):
    """POST /tenants/{id}/media-limits — admin-only cap overrides (>= floor)."""

    max_images_per_property: int = Field(
        ..., ge=MEDIA_LIMITS_FLOOR["max_images_per_property"],
        description=f"Min {MEDIA_LIMITS_FLOOR['max_images_per_property']}",
    )
    max_videos_per_property: int = Field(
        ..., ge=MEDIA_LIMITS_FLOOR["max_videos_per_property"],
        description=f"Min {MEDIA_LIMITS_FLOOR['max_videos_per_property']}",
    )
    max_image_mb: int = Field(
        ..., ge=MEDIA_LIMITS_FLOOR["max_image_mb"],
        description=f"Min {MEDIA_LIMITS_FLOOR['max_image_mb']}",
    )
    max_video_mb: int = Field(
        ..., ge=MEDIA_LIMITS_FLOOR["max_video_mb"],
        description=f"Min {MEDIA_LIMITS_FLOOR['max_video_mb']}",
    )


# ---------------------------------------------------------------------------
# Rich admin-portal detail view
# ---------------------------------------------------------------------------


class TenantCounts(BaseModel):
    users_count: int
    agents_count: int
    properties_count: int
    listings_count: int
    leads_count: int
    deals_count: int


class SubscriptionInfo(BaseModel):
    plan: str
    status: str


class TenantDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant: TenantResponse
    counts: TenantCounts
    recent_activity: list[AuditLogResponse]
    subscription_info: SubscriptionInfo
