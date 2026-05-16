"""Extended customer detail schemas — documents, deal history, listing interests."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from apps.api.models.enums import (
    CustomerListingInterestStatus,
    CustomerSource,
    CustomerStatus,
    DealStage,
    PrivateDocumentApprovalStatus,
    PrivateDocumentKind,
)


class CustomerDocumentSummary(BaseModel):
    """Document metadata shown on customer detail. No storage_key / raw URL."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: PrivateDocumentKind
    original_filename: str
    mime_type: str
    size_bytes: int
    approval_status: PrivateDocumentApprovalStatus
    approved_at: datetime | None = None
    rejected_reason: str | None = None
    uploaded_by_user_id: uuid.UUID | None = None
    created_at: datetime


class DealHistoryItem(BaseModel):
    """Compact deal record for the customer deal-history list."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage: DealStage
    transaction_value: Decimal
    transaction_currency: str
    created_at: datetime
    closed_at: datetime | None = None
    # Resolved from joined property
    property_title: str | None = None
    listing_id: uuid.UUID | None = None


class InterestedListingItem(BaseModel):
    """A customer ↔ listing interest row with a bit of listing context."""

    listing_id: uuid.UUID
    listing_title: str | None = None
    listing_status: str | None = None
    interest_status: CustomerListingInterestStatus
    linked_at: datetime
    notes: str | None = None
    # Only populated when interest_status == 'lost'
    won_to_customer_name: str | None = None


class CustomerDetailResponse(BaseModel):
    """Full customer detail payload returned by GET /customers/{customer_id}."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    full_name: str
    email: str | None = None
    phone: str | None = None
    phone_normalized: str | None = None
    nationality: str | None = None
    language: str | None = None
    preferred_currency: str | None = None
    source: CustomerSource
    status: CustomerStatus
    notes: str | None = None
    assigned_agent_id: uuid.UUID | None = None
    created_by_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    documents: list[CustomerDocumentSummary] = []
    deal_history: list[DealHistoryItem] = []
    interested_listings: list[InterestedListingItem] = []
