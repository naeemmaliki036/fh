"""Consumer listing lead schemas — buyer inquiry + contact reveal."""

from uuid import UUID

from pydantic import BaseModel, EmailStr


class ConsumerListingLeadRequest(BaseModel):
    buyer_name: str
    buyer_email: EmailStr
    buyer_phone: str | None = None
    buyer_message: str | None = None


class SellerContact(BaseModel):
    name: str | None = None
    email: str
    phone: str | None = None


class ConsumerListingLeadResponse(BaseModel):
    lead_id: UUID
    seller_contact: SellerContact
