"""Schemas for the marketplace_countries platform-admin catalog."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MarketplaceCountryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    name: str
    flag_emoji: str
    display_order: int
    enabled: bool
    created_at: datetime
    updated_at: datetime


class MarketplaceCountryListResponse(BaseModel):
    items: list[MarketplaceCountryResponse]
    total: int


class MarketplaceCountryCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")
    name: str = Field(..., min_length=1, max_length=120)
    flag_emoji: str = Field(..., min_length=1, max_length=8)
    display_order: int | None = None
    enabled: bool = True

    @field_validator("code", mode="before")
    @classmethod
    def upper_code(cls, v: str) -> str:
        return v.upper() if isinstance(v, str) else v


class MarketplaceCountryUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    flag_emoji: str | None = Field(default=None, min_length=1, max_length=8)
    display_order: int | None = None
    enabled: bool | None = None


class MarketplaceCountryReorderRequest(BaseModel):
    ordered_ids: list[uuid.UUID] = Field(..., min_length=1)


# Public endpoint response shape
class MarketplaceCountryPublicItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    flag_emoji: str
    display_order: int


class MarketplaceCountriesPublicResponse(BaseModel):
    countries: list[MarketplaceCountryPublicItem]
