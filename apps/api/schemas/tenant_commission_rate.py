"""Schemas for the tenant commission rates feature."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from apps.api.models.enums import CommissionRateTransactionType

_RATE_MIN = Decimal("0.001")
_RATE_MAX = Decimal("0.10")
_RATE_ERR = "Commission rate must be between 0.1% and 10%"


class TenantCommissionRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    transaction_type: CommissionRateTransactionType
    rate: Decimal
    notes: str | None = None
    updated_by_user_id: uuid.UUID | None = None
    updated_by_user_email: str | None = None
    created_at: datetime
    updated_at: datetime


class TenantCommissionRateUpdateRequest(BaseModel):
    rate: Decimal = Field(..., ge=_RATE_MIN, le=_RATE_MAX)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("rate")
    @classmethod
    def validate_rate_range(cls, v: Decimal) -> Decimal:
        if v < _RATE_MIN or v > _RATE_MAX:
            raise ValueError(_RATE_ERR)
        return v


class TenantCommissionRateListResponse(BaseModel):
    items: list[TenantCommissionRateResponse]


class TenantCommissionRateAuditEntry(BaseModel):
    id: uuid.UUID
    action: str
    actor_user_id: uuid.UUID | None = None
    actor_user_email: str | None = None
    before_value: dict | None = None
    after_value: dict | None = None
    occurred_at: datetime
