"""SQLAlchemy models — imported here for Alembic autogenerate detection."""

from .agent import Agent
from .audit_log import AuditLog
from .customer import Customer
from .deal import Deal
from .document_request import DocumentRequest
from .document_request_item import DocumentRequestItem
from .enums import (
    AgentStatus,
    AuditAction,
    CommissionPayoutStatus,
    CommissionType,
    CustomerSource,
    CustomerStatus,
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
    PrivateDocumentEntityType,
    PrivateDocumentKind,
    PropertyStatus,
    PropertyType,
    RentPeriod,
    TenantRole,
    TenantStatus,
    UserStatus,
)
from .lead import Lead
from .lead_activity import LeadActivity
from .listing import Listing
from .media import Media
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
    "PrivateDocumentEntityType",
    "PrivateDocumentKind",
    "CustomerSource",
    "CustomerStatus",
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
    # Models
    "Tenant",
    "PlatformUser",
    "User",
    "AuditLog",
    "Agent",
    "PrivateDocument",
    "Customer",
    "Property",
    "PropertyAgent",
    "Listing",
    "Media",
    "Lead",
    "LeadActivity",
    "DocumentRequest",
    "DocumentRequestItem",
    "Deal",
]
