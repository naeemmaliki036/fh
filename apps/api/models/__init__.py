"""SQLAlchemy models — imported here for Alembic autogenerate detection."""

from .agent import Agent
from .audit_log import AuditLog
from .customer import Customer
from .customer_listing_interest import CustomerListingInterest
from .deal import Deal
from .document_request import DocumentRequest
from .document_request_item import DocumentRequestItem
from .email_outbox import EmailOutbox
from .email_template import EmailTemplate
from .enums import (
    AgentStatus,
    AuditAction,
    CommissionPayoutStatus,
    CommissionType,
    CustomerListingInterestStatus,
    CustomerSource,
    CustomerStatus,
    CustomerType,
    DealStage,
    DealType,
    DocumentRequestStatus,
    LeadActivityKind,
    LeadStage,
    ListingPurpose,
    ListingStatus,
    ListingTier,
    MediaKind,
    PlatformRole,
    PrivateDocumentApprovalStatus,
    PrivateDocumentEntityType,
    PrivateDocumentKind,
    PropertyStatus,
    PropertyType,
    RentPeriod,
    TenantRole,
    TenantStatus,
    UserStatus,
)
from .property_enums import (
    CompletionStatus,
    FitOutStatus,
    FurnishingStatus,
    OwnershipType,
    ViewOrientation,
)
from .lead import Lead
from .location import Area, City, Country
from .off_market_reason import OffMarketReason
from .lead_activity import LeadActivity
from .listing import Listing
from .listing_document import ListingDocument
from .listing_price_history import ListingPriceHistory
from .media import Media
from .notification import Notification
from .platform_user import PlatformUser
from .private_document import PrivateDocument
from .property import Property
from .property_agent import PropertyAgent
from .tenant import Tenant
from .user import User

__all__ = [
    # Enums
    "TenantStatus",
    "PlatformRole",
    "TenantRole",
    "UserStatus",
    "AuditAction",
    "AgentStatus",
    "CommissionType",
    "CommissionPayoutStatus",
    "CustomerListingInterestStatus",
    "PrivateDocumentApprovalStatus",
    "PrivateDocumentEntityType",
    "PrivateDocumentKind",
    "CustomerSource",
    "CustomerStatus",
    "CustomerType",
    "PropertyType",
    "PropertyStatus",
    "ListingPurpose",
    "RentPeriod",
    "ListingStatus",
    "ListingTier",
    "MediaKind",
    "LeadStage",
    "LeadActivityKind",
    "DocumentRequestStatus",
    "DealType",
    "DealStage",
    # Property attribute enums (migration 0039)
    "FurnishingStatus",
    "CompletionStatus",
    "OwnershipType",
    "ViewOrientation",
    "FitOutStatus",
    # Models
    "Tenant",
    "PlatformUser",
    "User",
    "AuditLog",
    "Agent",
    "PrivateDocument",
    "Customer",
    "CustomerListingInterest",
    "Property",
    "PropertyAgent",
    "Listing",
    "ListingDocument",
    "ListingPriceHistory",
    "Media",
    "EmailTemplate",
    "EmailOutbox",
    "Lead",
    "LeadActivity",
    "DocumentRequest",
    "DocumentRequestItem",
    "Deal",
    "Notification",
    "OffMarketReason",
    "Country",
    "City",
    "Area",
]
