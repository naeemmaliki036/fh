"""Lead request/response schemas."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import CustomerSource, LeadStage


class InlineCustomerCreate(BaseModel):
    """Customer fields for inline creation during lead POST."""
    full_name: str
    email: str | None = None
    phone: str | None = None
    nationality: str | None = None
    language: str | None = None
    source: CustomerSource | None = None


class LeadCreateRequest(BaseModel):
    # One of customer_id OR customer must be present (validated in service)
    customer_id: uuid.UUID | None = None
    customer: InlineCustomerCreate | None = None
    source: CustomerSource
    stage: LeadStage = LeadStage.NEW
    assigned_agent_id: uuid.UUID | None = None
    interest_property_id: uuid.UUID | None = None
    interest_listing_id: uuid.UUID | None = None
    notes: str | None = None
    next_action_at: datetime | None = None


class LeadUpdateRequest(BaseModel):
    notes: str | None = None
    interest_property_id: uuid.UUID | None = None
    interest_listing_id: uuid.UUID | None = None
    next_action_at: datetime | None = None


class LeadTransitionRequest(BaseModel):
    stage: LeadStage
    description: str | None = None


class LeadAssignRequest(BaseModel):
    agent_id: uuid.UUID | None = None


class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    email: str | None = None
    phone: str | None = None
    phone_normalized: str | None = None


class PropertySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    status: str


class ListingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    purpose: str
    price: Decimal
    currency: str


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tenant_id: uuid.UUID
    customer_id: uuid.UUID
    source: CustomerSource
    stage: LeadStage
    assigned_agent_id: uuid.UUID | None = None
    assigned_at: datetime | None = None
    interest_property_id: uuid.UUID | None = None
    interest_listing_id: uuid.UUID | None = None
    notes: str | None = None
    next_action_at: datetime | None = None
    closed_at: datetime | None = None
    created_by_user_id: uuid.UUID | None = None
    customer: CustomerSummary | None = None
    interest_property: PropertySummary | None = None
    interest_listing: ListingSummary | None = None
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int
