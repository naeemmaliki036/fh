"""Pydantic schemas for the platform-wide marketplace feature.

All routes are public — no auth required.
"""

import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Embedded tenant snippet — shown alongside each listing/agency row.
# Intentionally does NOT include public_url (per product decision).
# ---------------------------------------------------------------------------


class MarketplaceTenantSnippet(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    logo_url: str | None = None
    banner_url: str | None = None
    tagline: str | None = None
    contact_phone: str
    contact_email: str


# ---------------------------------------------------------------------------
# Listing list item — extends the public-site shape with the tenant block.
# ---------------------------------------------------------------------------


class MarketplaceListingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    short_description: str | None = None
    price: float
    currency: str
    beds: int | None = None
    baths: int | None = None
    area_sqft: float | None = None
    area: str | None = None
    city: str | None = None
    property_type: str
    primary_photo_url: str | None = None
    purpose: str
    listing_tier: str | None = None
    created_at: str | None = None
    is_verified: bool = False
    price_per_sqft: float | None = None
    price_drop_pct: float | None = None
    internal_reference: str | None = None
    build_year: int | None = None
    agent_name: str | None = None
    agent_phone: str | None = None
    agent_photo_url: str | None = None
    agent_has_license: bool = False
    next_open_house_at: str | None = None
    tenant: MarketplaceTenantSnippet
    # Consumer listing fields (migration 0044)
    is_consumer_listing: bool = False
    owner_display_name: str | None = None


class MarketplaceListingListResponse(BaseModel):
    items: list[MarketplaceListingItem]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Listing detail — same as public-site but with tenant block inline.
# ---------------------------------------------------------------------------


class MarketplaceListingDetailResponse(BaseModel):
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
    agent: Any | None = None
    next_open_house: Any | None = None
    upcoming_open_houses: list[Any] = Field(default_factory=list)
    handover_year: int | None = None
    handover_quarter: int | None = None
    payment_plan: bool = False
    tenant: MarketplaceTenantSnippet
    # Consumer listing fields (migration 0044)
    is_consumer_listing: bool = False
    owner_display_name: str | None = None


# ---------------------------------------------------------------------------
# Agency list / detail
# ---------------------------------------------------------------------------


class MarketplaceAgencyItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    logo_url: str | None = None
    banner_url: str | None = None
    tagline: str | None = None
    contact_phone: str
    contact_email: str
    operating_countries: list[str] = Field(default_factory=list)
    listings_count: int
    agents_count: int


class MarketplaceAgencyDetail(MarketplaceAgencyItem):
    description: str | None = None


class MarketplaceAgencyListResponse(BaseModel):
    items: list[MarketplaceAgencyItem]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


class MarketplaceByType(BaseModel):
    property_type: str
    count: int


class MarketplaceStatsResponse(BaseModel):
    total_listings: int
    total_agencies: int
    by_type: list[MarketplaceByType]
