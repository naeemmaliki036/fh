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
  Tenant,
  TenantUpdateRequest,
  TenantListResponse,
} from "./tenant";

export type {
  TenantRole,
  UserStatus,
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserMeUpdateRequest,
  UserListResponse,
} from "./user";

export type { PlatformRole, PlatformUser } from "./platform-user";

export type {
  AgentStatus,
  CommissionType,
  Agent,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentListResponse,
  AgentListParams,
  PhotoUploadResponse,
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
} from "./listing";

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
