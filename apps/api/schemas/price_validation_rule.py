"""Schemas for price_validation_rules platform-admin API."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


_VALID_PURPOSES = {"sale", "rent_long", "rent_short"}


class PriceValidationRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    country: str | None
    city: str | None
    purpose: str | None
    currency: str
    min_amount: Decimal | None
    max_amount: Decimal | None
    notes: str | None
    enabled: bool
    display_order: int
    created_at: datetime
    updated_at: datetime


class PriceValidationRuleListResponse(BaseModel):
    items: list[PriceValidationRuleResponse]
    total: int


class PriceValidationRuleCreateRequest(BaseModel):
    country: str | None = Field(
        default=None,
        min_length=2,
        max_length=2,
        pattern=r"^[A-Z]{2}$",
        description="ISO-3166 alpha-2 country code. NULL = global.",
    )
    city: str | None = Field(default=None, max_length=120)
    purpose: Literal["sale", "rent_long", "rent_short"] | None = None
    currency: str = Field(default="AED", min_length=3, max_length=8)
    min_amount: Decimal | None = Field(default=None, ge=0)
    max_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    enabled: bool = True
    display_order: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _at_least_one_bound(self) -> "PriceValidationRuleCreateRequest":
        if self.min_amount is None and self.max_amount is None:
            raise ValueError("At least one of min_amount or max_amount is required.")
        return self

    @model_validator(mode="after")
    def _min_le_max(self) -> "PriceValidationRuleCreateRequest":
        if (
            self.min_amount is not None
            and self.max_amount is not None
            and self.max_amount < self.min_amount
        ):
            raise ValueError("max_amount must be >= min_amount.")
        return self


class PriceValidationRuleUpdateRequest(BaseModel):
    country: str | None = Field(
        default=None,
        min_length=2,
        max_length=2,
        pattern=r"^[A-Z]{2}$",
    )
    city: str | None = None
    purpose: Literal["sale", "rent_long", "rent_short"] | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=8)
    min_amount: Decimal | None = Field(default=None, ge=0)
    max_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    enabled: bool | None = None
    display_order: int | None = Field(default=None, ge=0)

    # Cross-field validation only fires when both bounds are present in the patch.
    @model_validator(mode="after")
    def _min_le_max(self) -> "PriceValidationRuleUpdateRequest":
        if (
            self.min_amount is not None
            and self.max_amount is not None
            and self.max_amount < self.min_amount
        ):
            raise ValueError("max_amount must be >= min_amount.")
        return self


class PriceValidationRuleReorderRequest(BaseModel):
    ordered_ids: list[uuid.UUID] = Field(..., min_length=1)


class PriceValidationRuleSourceItem(BaseModel):
    rule_id: str
    country: str | None
    city: str | None
    purpose: str | None
    currency: str
    min_amount: str | None
    max_amount: str | None


class PriceValidationPreviewResponse(BaseModel):
    effective_min_amount: str | None
    effective_max_amount: str | None
    currency: str
    sources: list[PriceValidationRuleSourceItem]
