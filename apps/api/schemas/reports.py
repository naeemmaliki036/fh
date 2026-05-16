"""Schemas for the reports endpoints."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import CommissionType, DealType


class ClosedDealRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    deal_id: uuid.UUID
    closed_at: datetime | None = None
    deal_type: DealType
    transaction_value: Decimal
    transaction_currency: str
    property_id: uuid.UUID
    property_title: str
    customer_id: uuid.UUID
    customer_display_name: str
    primary_agent_id: uuid.UUID
    primary_agent_name: str
    secondary_agent_id: uuid.UUID | None = None
    secondary_agent_name: str | None = None
    commission_type: CommissionType
    commission_value: Decimal
    commission_paid_amount: Decimal


class ClosedDealsResponse(BaseModel):
    items: list[ClosedDealRow]
    total: int
    page: int
    page_size: int
