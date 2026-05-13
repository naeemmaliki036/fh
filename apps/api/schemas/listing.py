"""Listing request/response schemas with purpose↔rent_period invariant."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, model_validator

from apps.api.models.enums import ListingPurpose, ListingStatus, ListingTier, RentPeriod

_RENT_PURPOSES = {ListingPurpose.RENT_SHORT, ListingPurpose.RENT_LONG}


class ListingCreateRequest(BaseModel):
    purpose: ListingPurpose
    title: str
    description: str | None = None
    price: Decimal
    currency: str
    rent_period: RentPeriod | None = None
    status: ListingStatus = ListingStatus.DRAFT
    listing_tier: ListingTier = ListingTier.STANDARD
    valid_from: date | None = None
    valid_until: date | None = None

    @model_validator(mode="after")
    def check_rent_period(self) -> "ListingCreateRequest":
        if self.purpose == ListingPurpose.SALE and self.rent_period is not None:
            raise ValueError("rent_period must be null for sale listings")
        if self.purpose in _RENT_PURPOSES and self.rent_period is None:
            raise ValueError("rent_period is required for rent listings")
        return self


class ListingUpdateRequest(BaseModel):
    purpose: ListingPurpose | None = None
    title: str | None = None
    description: str | None = None
    # price intentionally omitted — use PATCH /{id}/price (audited price history)
    currency: str | None = None
    rent_period: RentPeriod | None = None
    listing_tier: ListingTier | None = None
    valid_from: date | None = None
    valid_until: date | None = None

    @model_validator(mode="after")
    def check_rent_period(self) -> "ListingUpdateRequest":
        purpose = self.purpose
        rent_period = self.rent_period
        if purpose is None:
            return self  # no purpose change; service validates combined state
        if purpose == ListingPurpose.SALE and rent_period is not None:
            raise ValueError("rent_period must be null for sale listings")
        if purpose in _RENT_PURPOSES and rent_period is None:
            raise ValueError("rent_period is required for rent listings")
        return self


class ListingPriceChangeRequest(BaseModel):
    new_price: Decimal
    reason_note: str | None = None


class ListingHeroMediaRequest(BaseModel):
    media_id: uuid.UUID | None = None


class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    property_id: uuid.UUID
    purpose: ListingPurpose
    title: str
    description: str | None = None
    price: Decimal
    currency: str
    rent_period: RentPeriod | None = None
    status: ListingStatus
    listing_tier: ListingTier
    valid_from: date | None = None
    valid_until: date | None = None
    portal_sync_enabled: bool
    hero_media_id: uuid.UUID | None = None
    hero_media_url: str | None = None  # assembled by router/service
    thumbnail_url: str | None = None
    thumbnail_kind: str | None = None  # "image" | "video"
    created_at: datetime
    updated_at: datetime


class ListingListResponse(BaseModel):
    items: list[ListingResponse]
    total: int


class ListingPriceHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    listing_id: uuid.UUID
    old_price: Decimal
    new_price: Decimal
    currency: str
    changed_by_user_id: uuid.UUID | None = None
    reason_note: str | None = None
    changed_at: datetime


class ListingPriceHistoryListResponse(BaseModel):
    items: list[ListingPriceHistoryResponse]
    total: int


class ListingDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    listing_id: uuid.UUID
    tenant_id: uuid.UUID
    storage_key: str
    url: str  # assembled by service
    file_name: str
    mime_type: str
    size_bytes: int
    kind: str
    uploaded_by_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class ListingDocumentListResponse(BaseModel):
    items: list[ListingDocumentResponse]
    total: int
