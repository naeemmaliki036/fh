export type TenantStatus = "pending_approval" | "active" | "suspended";
export type PropertiesViewMode = "card" | "list";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  currency: string;
  timezone: string;
  locale: string;
  default_properties_view: PropertiesViewMode;
  operating_countries: string[];
  contact_email: string;
  contact_phone: string;
  property_ref_prefix: string;
  banner_url: string | null;
  aggregator_enabled: boolean;
  aggregator_disabled_at: string | null;
  aggregator_disabled_reason: string | null;
  /** Platform master switch — only platform admins can toggle. */
  public_site_feature_enabled: boolean;
  /** Tenant's own on/off toggle. */
  public_site_enabled: boolean;
  /** When true, only listing-detail URLs resolve; index/profile/agents → 404. */
  public_site_direct_links_only: boolean;
  approved_at: string | null;
  approved_by_id: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  // Per-tenant media caps (admin-set, read-only for tenants)
  max_images_per_property: number;
  max_videos_per_property: number;
  max_image_mb: number;
  max_video_mb: number;
  // migration 0051 — doc request default instructions (HTML string)
  document_request_default_instructions: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMediaLimitsRequest {
  max_images_per_property: number;
  max_videos_per_property: number;
  max_image_mb: number;
  max_video_mb: number;
}

export interface TenantUpdateRequest {
  name?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  default_properties_view?: PropertiesViewMode;
  operating_countries?: string[];
  banner_url?: string | null;
  document_request_default_instructions?: string;
}

export interface TenantListResponse {
  items: Tenant[];
  total: number;
  page: number;
  page_size: number;
}

export interface TenantListParams {
  status?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface TenantSubscriptionInfo {
  plan: string | null;
  status: string | null;
  expires_at: string | null;
}

export interface TenantActivityEntry {
  id: string;
  actor_name: string | null;
  action: string;
  diff_summary: string | null;
  created_at: string;
}

export interface TenantCounts {
  users: number;
  agents: number;
  properties: number;
  listings: number;
  leads: number;
  deals: number;
}

export interface TenantDetailResponse extends Tenant {
  counts: TenantCounts;
  recent_activity: TenantActivityEntry[];
  subscription_info: TenantSubscriptionInfo | null;
  office_country: string | null;
  office_city: string | null;
  signup_notes: string | null;
}

export interface TenantLifecycleRequest {
  reason_note?: string;
}

export interface PublicSiteFeatureRequest {
  enabled: boolean;
}

export interface TenantSendMessageRequest {
  subject: string;
  body_text: string;
}

export interface PropertyRefPrefixRequest {
  property_ref_prefix: string;
}

export interface AggregatorStatusRequest {
  enabled: boolean;
  reason?: string;
}

