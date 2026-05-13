"""Deal request/response schemas."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from apps.api.models.enums import (
    CommissionPayoutStatus,
    CommissionType,
    DealStage,
    DealType,
)


class DealCreateRequest(BaseModel):
    deal_type: DealType
    customer_id: uuid.UUID
    property_id: uuid.UUID
    listing_id: uuid.UUID | None = None
    primary_agent_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    transaction_value: Decimal
    transaction_currency: str
    expected_close_at: date | None = None
    notes: str | None = None
    commission_type: CommissionType | None = None
    commission_value: Decimal | None = None
    commission_override_reason: str | None = None


class DealUpdateRequest(BaseModel):
    notes: str | None = None
    expected_close_at: date | None = None
    listing_id: uuid.UUID | None = None
    transaction_value: Decimal | None = None
    transaction_currency: str | None = None


class DealTransitionRequest(BaseModel):
    stage: DealStage
    description: str | None = None


class DealCommissionOverrideRequest(BaseModel):
    commission_type: CommissionType
    commission_value: Decimal
    override_reason: str = Field(min_length=5)


class DealCommissionPayoutRequest(BaseModel):
    amount: Decimal
    paid_at: datetime | None = None


class DealCommissionPayoutCancelRequest(BaseModel):
    reason_note: str = Field(..., min_length=5, max_length=1000)


class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    phone: str | None = None
    phone_normalized: str | None = None


class AgentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    email: str


class PropertySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    status: str


class DealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    deal_type: DealType
    customer_id: uuid.UUID
    property_id: uuid.UUID
    listing_id: uuid.UUID | None = None
    primary_agent_id: uuid.UUID
    lead_id: uuid.UUID | None = None
    stage: DealStage
    transaction_value: Decimal
    transaction_currency: str
    expected_close_at: date | None = None
    closed_at: datetime | None = None
    notes: str | None = None
    commission_type: CommissionType
    commission_value: Decimal
    commission_amount: Decimal  # computed; not a DB column
    commission_overridden: bool
    commission_override_reason: str | None = None
    commission_payout_status: CommissionPayoutStatus
    commission_paid_amount: Decimal
    commission_paid_at: datetime | None = None
    created_by_user_id: uuid.UUID | None = None
    customer: CustomerSummary | None = None
    primary_agent: AgentSummary | None = None
    interest_property: PropertySummary | None = None
    created_at: datetime
    updated_at: datetime


class DealListResponse(BaseModel):
    items: list[DealResponse]
    total: int
