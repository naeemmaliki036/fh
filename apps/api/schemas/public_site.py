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


class PublicOpenHouseSnippet(BaseModel):
    starts_at: str
    ends_at: str


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
    area: str | None = None
    city: str | None = None
    property_type: str
    primary_photo_url: str | None = None
    purpose: str
    tags: list[str] = Field(default_factory=list)
    is_verified: bool = False
    internal_reference: str | None = None
    price_per_sqft: float | None = None
    build_year: int | None = None
    listing_tier: str | None = None
    next_open_house_at: str | None = None
    # Agent card fields — populated by bulk query, no N+1.
    agent_name: str | None = None
    agent_phone: str | None = None
    agent_photo_url: str | None = None
    agent_has_license: bool = False


class PublicListingListResponse(BaseModel):
    items: list[PublicListingItem]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Public: listing stats banner
# ---------------------------------------------------------------------------


class PublicListingTypeCount(BaseModel):
    property_type: str
    count: int


class PublicListingStatsResponse(BaseModel):
    total: int
    by_type: list[PublicListingTypeCount]


# ---------------------------------------------------------------------------
# Public: listing detail
# ---------------------------------------------------------------------------


class PublicAgentSnippet(BaseModel):
    id: uuid.UUID
    full_name: str
    photo_url: str | None = None
    phone: str | None = None
    email: str


class PublicUpcomingOpenHouse(BaseModel):
    starts_at: str
    ends_at: str
    capacity: int | None = None


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
    area: str | None = None
    city: str | None = None
    internal_reference: str | None = None
    build_year: int | None = None
    property_type: str
    amenities: list[Any] | None = None
    tags: list[str] = Field(default_factory=list)
    media_urls: list[str] = Field(default_factory=list)
    floor_plan_urls: list[str] = Field(default_factory=list)
    hero_media_url: str | None = None
    agent: PublicAgentSnippet | None = None
    next_open_house: PublicOpenHouseSnippet | None = None
    upcoming_open_houses: list[PublicUpcomingOpenHouse] = Field(default_factory=list)
    # Off-plan delivery info (migration 0039).
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool = False
    # Branding — present in all visibility states (including direct_only)
    # so the listing-detail page can render without a separate profile call.
    tenant_name: str | None = None
    tenant_logo_url: str | None = None
    tenant_tagline: str | None = None
    tenant_contact_email: str | None = None
    tenant_contact_phone: str | None = None


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
    public_site_feature_enabled: bool = False
    public_site_enabled: bool
    public_site_direct_links_only: bool = False
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
    """PATCH /tenants/me/public-site — all fields optional.

    Tenants may set public_site_enabled and public_site_direct_links_only.
    public_site_feature_enabled is platform-only; sending it raises 422.
    """

    public_site_enabled: bool | None = None
    public_site_direct_links_only: bool | None = None
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
