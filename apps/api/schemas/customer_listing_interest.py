"""Schemas for customer ↔ listing interest linkage."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import CustomerListingInterestStatus


class LinkCustomerRequest(BaseModel):
    customer_id: uuid.UUID
    notes: str | None = None


class CustomerListingInterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    customer_id: uuid.UUID
    listing_id: uuid.UUID
    status: CustomerListingInterestStatus
    linked_by_user_id: uuid.UUID | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class InterestedCustomerItem(BaseModel):
    """Row returned by GET /listings/{id}/interested-customers."""

    customer_id: uuid.UUID
    customer_name: str
    customer_phone: str | None = None
    customer_email: str | None = None
    status: CustomerListingInterestStatus
    notes: str | None = None
    linked_at: datetime


class InterestedCustomerListResponse(BaseModel):
    items: list[InterestedCustomerItem]
