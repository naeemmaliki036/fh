"""Shared enums for the fh platform models.

All enums are str-based so they serialise cleanly to/from JSON and SQLAlchemy
native_enum=True stores them as Postgres enum types (defined in migration).
"""

import enum


class TenantStatus(str, enum.Enum):
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class PlatformRole(str, enum.Enum):
    """Roles for cross-tenant platform operators (platform_users table)."""

    SUPER_ADMIN = "super_admin"
    OPERATIONS_ADMIN = "operations_admin"
    FINANCE_ADMIN = "finance_admin"
    SUPPORT_ADMIN = "support_admin"  # Added in migration 0024


class TenantRole(str, enum.Enum):
    """Roles for users who belong to a tenant (users table)."""

    COMPANY_OWNER = "company_owner"
    COMPANY_ADMIN = "company_admin"
    PROPERTY_ADMIN = "property_admin"
    LISTING_MANAGER = "listing_manager"
    AGENT = "agent"
    FINANCE_USER = "finance_user"
    READ_ONLY = "read_only"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class PropertiesViewMode(str, enum.Enum):
    CARD = "card"
    LIST = "list"


class AuditAction(str, enum.Enum):
    """Every auditable event in the platform.

    Add new values here AND in the 0002 migration enum DDL + a follow-up
    migration to ALTER TYPE ... ADD VALUE if the DB is already live.
    """

    # Tenant lifecycle
    TENANT_CREATED = "tenant_created"
    TENANT_APPROVED = "tenant_approved"
    TENANT_SUSPENDED = "tenant_suspended"
    TENANT_UPDATED = "tenant_updated"

    # User lifecycle
    USER_CREATED = "user_created"
    USER_ROLE_CHANGED = "user_role_changed"
    USER_DISABLED = "user_disabled"
    USER_ENABLED = "user_enabled"
    USER_PASSWORD_CHANGED = "user_password_changed"

    # Document events
    DOCUMENT_ACCESSED = "document_accessed"
    DOCUMENT_UPLOADED = "document_uploaded"

    # Deal / commission
    COMMISSION_OVERRIDDEN = "commission_overridden"
    DEAL_STAGE_CHANGED = "deal_stage_changed"
    AGENT_COMMISSION_CHANGED = "agent_commission_changed"

    # Payments
    PAYMENT_LINK_STATE_CHANGED = "payment_link_state_changed"

    # Auth
    LOGIN_SUCCEEDED = "login_succeeded"
    LOGIN_FAILED = "login_failed"

    # Lead events
    LEAD_CREATED = "lead_created"

    # Status change events
    AGENT_STATUS_CHANGED = "agent_status_changed"
    LISTING_STATUS_CHANGED = "listing_status_changed"
    PROPERTY_STATUS_CHANGED = "property_status_changed"

    # Property / listing field changes
    PROPERTY_TAGS_CHANGED = "property_tags_changed"
    LISTING_PRICE_CHANGED = "listing_price_changed"
    LISTING_HERO_MEDIA_SET = "listing_hero_media_set"

    # Listing document events
    LISTING_DOCUMENT_UPLOADED = "listing_document_uploaded"
    LISTING_DOCUMENT_DELETED = "listing_document_deleted"

    # Listing review workflow
    LISTING_SUBMITTED_FOR_REVIEW = "listing_submitted_for_review"
    LISTING_REVIEW_DECISION = "listing_review_decision"
    LISTING_PUBLISHED = "listing_published"

    # Tenant lifecycle — extended
    TENANT_REACTIVATED = "tenant_reactivated"
    TENANT_REJECTED = "tenant_rejected"

    # Platform user management
    PLATFORM_USER_CREATED = "platform_user_created"
    PLATFORM_USER_UPDATED = "platform_user_updated"
    PLATFORM_USER_ROLE_CHANGED = "platform_user_role_changed"
    PLATFORM_USER_PASSWORD_RESET = "platform_user_password_reset"

    # Catch-all for ad-hoc events
    OTHER = "other"


class AgentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"


class CommissionType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class PrivateDocumentEntityType(str, enum.Enum):
    AGENT = "agent"
    CUSTOMER = "customer"
    DEAL = "deal"
    TENANT = "tenant"


class PrivateDocumentKind(str, enum.Enum):
    RERA_ID = "rera_id"
    PASSPORT = "passport"
    EMIRATES_ID = "emirates_id"
    TRADE_LICENSE = "trade_license"
    NOC = "noc"
    CONTRACT = "contract"
    KYC = "kyc"
    OTHER = "other"


class CustomerSource(str, enum.Enum):
    PORTAL = "portal"
    WEBSITE = "website"
    MANUAL = "manual"
    IMPORT = "import"
    REFERRAL = "referral"
    WALK_IN = "walk_in"
    OTHER = "other"


class CustomerStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLACKLISTED = "blacklisted"


class PropertyType(str, enum.Enum):
    APARTMENT = "apartment"
    VILLA = "villa"
    TOWNHOUSE = "townhouse"
    PENTHOUSE = "penthouse"
    OFFICE = "office"
    RETAIL = "retail"
    WAREHOUSE = "warehouse"
    PLOT = "plot"
    BUILDING = "building"
    OTHER = "other"


class PropertyStatus(str, enum.Enum):
    DRAFT = "draft"
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    RENTED = "rented"
    OFF_MARKET = "off_market"


class ListingPurpose(str, enum.Enum):
    SALE = "sale"
    RENT_SHORT = "rent_short"
    RENT_LONG = "rent_long"


class RentPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    ACTIVE = "active"
    PAUSED = "paused"
    EXPIRED = "expired"
    ARCHIVED = "archived"
    SOLD = "sold"
    RENTED = "rented"
    OFF_MARKET = "off_market"


class ListingTier(str, enum.Enum):
    STANDARD = "standard"
    PREMIUM = "premium"
    FEATURED = "featured"


class MediaKind(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    FLOORPLAN = "floorplan"
    BROCHURE = "brochure"


class LeadStage(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    VIEWING = "viewing"
    OFFER = "offer"
    WON = "won"
    LOST = "lost"


class LeadActivityKind(str, enum.Enum):
    NOTE = "note"
    STAGE_CHANGED = "stage_changed"
    ASSIGNMENT_CHANGED = "assignment_changed"
    CONTACT_MADE = "contact_made"
    VIEWING_SCHEDULED = "viewing_scheduled"
    VIEWING_COMPLETED = "viewing_completed"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    OTHER = "other"


class DocumentRequestStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETE = "complete"
    EXPIRED = "expired"
    CANCELED = "canceled"


class DealType(str, enum.Enum):
    SALE = "sale"
    RENT_SHORT = "rent_short"
    RENT_LONG = "rent_long"


class DealStage(str, enum.Enum):
    INITIATED = "initiated"
    DOCUMENTS_PENDING = "documents_pending"
    DEPOSIT_PENDING = "deposit_pending"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    CANCELED = "canceled"


class CommissionPayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELED = "canceled"
