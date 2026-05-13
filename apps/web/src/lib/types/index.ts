export type {
  LoginRequest,
  PlatformLoginRequest,
  RegisterTenantRequest,
  TokenResponse,
  AuthUserResponse,
  LoginResponse,
  PlatformUserAuthPayload,
  PlatformLoginResponse,
  RegisterTenantResponse,
  MeResponse,
  JwtClaims,
} from "./auth";

export type {
  TenantStatus,
  PropertiesViewMode,
  Tenant,
  TenantUpdateRequest,
  TenantListResponse,
  TenantListParams,
  TenantSubscriptionInfo,
  TenantActivityEntry,
  TenantCounts,
  TenantDetailResponse,
  TenantLifecycleRequest,
} from "./tenant";

export type {
  TenantRole,
  UserStatus,
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserMeUpdateRequest,
  UserListResponse,
  UserStatusChangeRequest,
} from "./user";

export type {
  PlatformRole,
  PlatformUserStatus,
  PlatformUser,
  PlatformUserCreateRequest,
  PlatformUserUpdateRequest,
  PlatformUserResetPasswordRequest,
  PlatformUserListResponse,
} from "./platform-user";

export type {
  AgentStatus,
  CommissionType,
  Agent,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentListResponse,
  AgentListParams,
  PhotoUploadResponse,
  AgentStatusChangeRequest,
} from "./agent";

export type {
  PrivateDocumentKind,
  PrivateDocumentEntityType,
  PrivateDocument,
  PrivateDocumentListResponse,
  DownloadUrlResponse,
} from "./private-document";

export type {
  CustomerSource,
  CustomerStatus,
  Customer,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerListResponse,
  CustomerListParams,
} from "./customer";
export { CustomerConflictError } from "./customer";

export type {
  PropertyType,
  PropertyStatus,
  PropertyAgentAssignment,
  Property,
  PropertyCreateRequest,
  PropertyUpdateRequest,
  PropertyListResponse,
  PropertyListParams,
  PropertyAgentAssignRequest,
  PropertyAgentPatchRequest,
  PropertyStatusChangeRequest,
} from "./property";

export type {
  ListingPurpose,
  RentPeriod,
  ListingStatus,
  ListingTier,
  Listing,
  ListingCreateRequest,
  ListingUpdateRequest,
  ListingListResponse,
  ListingListParams,
  ListingStatusChangeRequest,
} from "./listing";

export type {
  ListingPriceChangeRequest,
  ListingPriceHistoryEntry,
  ListingPriceHistoryResponse,
  ListingHeroMediaRequest,
} from "./listing-price";

export type {
  ListingDocumentKind,
  ListingDocument,
  ListingDocumentListResponse,
  ListingDocumentUploadRequest,
} from "./listing-document";

export type {
  AuditAction,
  AuditLog,
  AuditLogListResponse,
  AuditLogListParams,
} from "./audit-log";

export type {
  MediaKind,
  Media,
  MediaUpdateRequest,
  MediaListResponse,
  MediaReorderRequest,
} from "./media";

export type {
  LeadStage,
  CustomerSummary,
  PropertySummary,
  ListingSummary,
  Lead,
  InlineCustomerCreate,
  LeadCreateRequest,
  LeadUpdateRequest,
  LeadTransitionRequest,
  LeadAssignRequest,
  LeadListResponse,
  LeadListParams,
} from "./lead";
export { STAGE_TRANSITIONS, TERMINAL_STAGES, LeadConflictError } from "./lead";

export type {
  LeadActivityKind,
  LeadActivity,
  LeadActivityCreateRequest,
  LeadActivityListResponse,
} from "./lead-activity";
export { MANUAL_ACTIVITY_KINDS } from "./lead-activity";

export type {
  DealType,
  DealStage,
  CommissionPayoutStatus,
  DealCustomerSummary,
  DealAgentSummary,
  DealPropertySummary,
  Deal,
  DealCreateRequest,
  DealUpdateRequest,
  DealTransitionRequest,
  DealCommissionOverrideRequest,
  DealCommissionPayoutRequest,
  DealListResponse,
  DealListParams,
} from "./deal";
export { DEAL_STAGE_TRANSITIONS, DEAL_TERMINAL_STAGES } from "./deal";

export type {
  DocumentRequestStatus,
  DocumentRequestItemResponse,
  DocumentRequest,
  DocumentRequestCreateResponse,
  DocumentRequestItemCreate,
  DocumentRequestCreate,
  DocumentRequestListResponse,
  DocumentRequestListParams,
  RegenerateCodeResponse,
} from "./document-request";

export type {
  PublicItemResponse,
  PublicDocumentRequestResponse,
  VerifyRequest,
  VerifyResponse,
  UploadItemResponse,
} from "./public-document-request";

export type {
  NotificationKind,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  NotificationListParams,
} from "./notification";

export type {
  EmailTemplateScope,
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
  EmailTemplateListParams,
  EmailTemplateListResponse,
  TestSendRequest,
  TestSendResponse,
  EmailOutboxStatus,
  EmailOutboxItem,
  EmailOutboxListParams,
  EmailOutboxListResponse,
  ProcessOutboxResponse,
} from "./email";

export type {
  PublicSiteStats,
  HeroConfig,
  ThemeConfig,
  ServiceCard,
  ServicesConfig,
  TeamMember,
  TeamConfig,
  FooterConfig,
  SectionsConfig,
  ContactSectionConfig,
  RawSiteConfig,
  ResolvedSiteConfig,
  PublicTenantProfile,
  PublicListingItem,
  PublicListingListResponse,
  PublicAgentSnippet,
  PublicListingDetail,
  PublicLeadCreate,
  PublicLeadResponse,
  PublicSiteSettings,
  PublicSiteSettingsUpdate,
  PublicListingsParams,
} from "./public-site";
