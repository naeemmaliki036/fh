"""Pydantic schemas for the public-site feature.

Covers:
- Public tenant profile (slug lookup)
- Public listing list + detail
- Public lead creation (inbound contact form)
- Tenant admin: read / update public-site settings
"""

import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from apps.api.schemas.public_site_config import PublicSiteConfig


# ---------------------------------------------------------------------------
# Public: tenant stats (embedded in profile response)
# ---------------------------------------------------------------------------


class PublicTenantStats(BaseModel):
    listings_count: int
    agents_count: int
    featured_area: str | None = None
    inventory_value_aed: int


# ---------------------------------------------------------------------------
# Public: tenant profile
# ---------------------------------------------------------------------------


class PublicTenantProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    logo_url: str | None = None
    tagline: str | None = None
    contact_email: str
    contact_phone: str
    operating_countries: list[str] = Field(default_factory=lambda: ["AE"])
    stats: PublicTenantStats | None = None
    config: dict | None = None


# ---------------------------------------------------------------------------
# Public: listing list item (paginated)
# ---------------------------------------------------------------------------


class PublicListingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    short_description: str | None = None
    price: float
    currency: str
    beds: int | None = None
    baths: int | None = None
    area_sqft: float | None = None
    address: str | None = None
    property_type: str
    primary_photo_url: str | None = None
    purpose: str
    tags: list[str] = Field(default_factory=list)


class PublicListingListResponse(BaseModel):
    items: list[PublicListingItem]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Public: listing detail
# ---------------------------------------------------------------------------


class PublicAgentSnippet(BaseModel):
    id: uuid.UUID
    full_name: str
    photo_url: str | None = None
    phone: str | None = None
    email: str


class PublicListingDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    short_description: str | None = None
    description: str | None = None
    price: float
    currency: str
    purpose: str
    status: str
    beds: int | None = None
    baths: int | None = None
    area_sqft: float | None = None
    address: str | None = None
    property_type: str
    amenities: list[Any] | None = None
    tags: list[str] = Field(default_factory=list)
    media_urls: list[str] = Field(default_factory=list)
    hero_media_url: str | None = None
    agent: PublicAgentSnippet | None = None


# ---------------------------------------------------------------------------
# Public: agents grid
# ---------------------------------------------------------------------------


class PublicAgentCard(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: str | None = None
    photo_url: str | None = None
    license_id: str | None = None


class PublicAgentsResponse(BaseModel):
    items: list[PublicAgentCard]


# ---------------------------------------------------------------------------
# Public: lead creation
# ---------------------------------------------------------------------------


class PublicLeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=32)
    message: str | None = Field(default=None, max_length=2000)
    listing_id: uuid.UUID | None = None


class PublicLeadResponse(BaseModel):
    id: uuid.UUID


# ---------------------------------------------------------------------------
# Tenant admin: public-site settings
# ---------------------------------------------------------------------------


class PublicSiteSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    public_site_enabled: bool
    public_site_logo_url: str | None = None
    public_site_tagline: str | None = None
    public_url_hint: str
    config: dict = Field(default_factory=dict)
    # Per-tenant media limits (read-only for tenant owners)
    max_images_per_property: int = 20
    max_videos_per_property: int = 2
    max_image_mb: int = 10
    max_video_mb: int = 25


class PublicSiteSettingsUpdate(BaseModel):
    """PATCH /tenants/me/public-site — all fields optional."""

    public_site_enabled: bool | None = None
    public_site_logo_url: str | None = None
    public_site_tagline: str | None = Field(default=None, max_length=200)
    config: PublicSiteConfig | None = None

    @field_validator("public_site_logo_url", mode="before")
    @classmethod
    def _validate_logo_url(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not v.startswith("https://"):
            raise ValueError("logo_url must use https://")
        return v
