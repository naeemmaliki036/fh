"""Customer request/response schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator

from apps.api.models.enums import CustomerSource, CustomerStatus, CustomerType


class CustomerCreateRequest(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str  # required
    nationality: str | None = None
    language: str | None = None
    preferred_currency: str | None = None
    source: CustomerSource = CustomerSource.MANUAL
    status: CustomerStatus = CustomerStatus.ACTIVE
    notes: str | None = None
    assigned_agent_id: uuid.UUID | None = None
    source_agent_id: uuid.UUID | None = None
    customer_type: Literal["individual", "company"] = "individual"
    company_trade_license: str | None = None
    contact_person_name: str | None = None
    contact_person_designation: str | None = None

    @model_validator(mode="after")
    def _validate_type_fields(self) -> "CustomerCreateRequest":
        if self.customer_type == "company":
            if not self.contact_person_name or len(self.contact_person_name.strip()) < 2:
                raise ValueError(
                    "contact_person_name is required (min 2 chars) for company customers"
                )
            if len(self.full_name.strip()) < 2:
                raise ValueError("full_name (company name) must be at least 2 characters")
        else:
            # individual: company-only fields must not be set
            if self.contact_person_name is not None:
                raise ValueError("contact_person_name must be null for individual customers")
            if self.contact_person_designation is not None:
                raise ValueError(
                    "contact_person_designation must be null for individual customers"
                )
            if self.company_trade_license is not None:
                raise ValueError(
                    "company_trade_license must be null for individual customers"
                )
        return self


class CustomerUpdateRequest(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    nationality: str | None = None
    language: str | None = None
    preferred_currency: str | None = None
    source: CustomerSource | None = None
    notes: str | None = None
    assigned_agent_id: uuid.UUID | None = None
    source_agent_id: uuid.UUID | None = None
    customer_type: Literal["individual", "company"] | None = None
    company_trade_license: str | None = None
    contact_person_name: str | None = None
    contact_person_designation: str | None = None

    @model_validator(mode="after")
    def _validate_type_fields(self) -> "CustomerUpdateRequest":
        ct = self.customer_type
        if ct is None:
            # No type change in this patch — skip cross-field validation.
            return self
        if ct == "company":
            if not self.contact_person_name or len(self.contact_person_name.strip()) < 2:
                raise ValueError(
                    "contact_person_name is required (min 2 chars) when setting customer_type=company"
                )
        else:
            if self.contact_person_name is not None:
                raise ValueError("contact_person_name must be null for individual customers")
            if self.contact_person_designation is not None:
                raise ValueError(
                    "contact_person_designation must be null for individual customers"
                )
            if self.company_trade_license is not None:
                raise ValueError(
                    "company_trade_license must be null for individual customers"
                )
        return self


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    customer_type: CustomerType = CustomerType.INDIVIDUAL
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
    source_agent_id: uuid.UUID | None = None
    created_by_user_id: uuid.UUID | None = None
    company_trade_license: str | None = None
    contact_person_name: str | None = None
    contact_person_designation: str | None = None
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int


class MergeHintResponse(BaseModel):
    """Returned as the body of a 409 when a duplicate phone_normalized is detected."""

    detail: str
    existing_customer_id: uuid.UUID
