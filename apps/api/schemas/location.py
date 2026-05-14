"""Location schemas: Country, City, Area — read + write."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Area
# ---------------------------------------------------------------------------

class AreaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    city_id: uuid.UUID
    slug: str
    label: str
    active: bool
    ordering: int
    created_at: datetime
    updated_at: datetime


class AreaCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=128, pattern=r"^[a-z0-9-]+$")
    label: str = Field(min_length=1, max_length=256)
    ordering: int = 0


class AreaUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=256)
    active: bool | None = None
    ordering: int | None = None


class AreaBulkItem(BaseModel):
    slug: str = Field(min_length=1, max_length=128, pattern=r"^[a-z0-9-]+$")
    label: str = Field(min_length=1, max_length=256)


class AreaBulkCreate(BaseModel):
    city_id: uuid.UUID
    items: list[AreaBulkItem] = Field(min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# City
# ---------------------------------------------------------------------------

class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    country_id: uuid.UUID
    slug: str
    label: str
    active: bool
    ordering: int
    created_at: datetime
    updated_at: datetime


class CityWithAreaCount(CityResponse):
    area_count: int = 0


class CityCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=128, pattern=r"^[a-z0-9-]+$")
    label: str = Field(min_length=1, max_length=256)
    ordering: int = 0


class CityUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=256)
    active: bool | None = None
    ordering: int | None = None


# ---------------------------------------------------------------------------
# Country
# ---------------------------------------------------------------------------

class CountryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    code: str
    name: str
    currency: str | None
    flag_emoji: str | None
    active: bool
    ordering: int
    created_at: datetime
    updated_at: datetime


class CountryWithCounts(CountryResponse):
    city_count: int = 0
    area_count: int = 0


class CountryCreate(BaseModel):
    code: str = Field(min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")
    name: str = Field(min_length=1, max_length=256)
    currency: str | None = Field(default=None, max_length=3)
    flag_emoji: str | None = None
    ordering: int = 0


class CountryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=256)
    currency: str | None = None
    flag_emoji: str | None = None
    active: bool | None = None
    ordering: int | None = None


# ---------------------------------------------------------------------------
# Full tree (bulk endpoint)
# ---------------------------------------------------------------------------

class AreaSlim(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    label: str
    ordering: int


class CitySlim(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    slug: str
    label: str
    ordering: int
    areas: list[AreaSlim] = []


class CountryTree(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    code: str
    name: str
    currency: str | None
    flag_emoji: str | None
    ordering: int
    cities: list[CitySlim] = []
