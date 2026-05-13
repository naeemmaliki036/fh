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
  approved_at: string | null;
  approved_by_id: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantUpdateRequest {
  name?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  default_properties_view?: PropertiesViewMode;
  operating_countries?: string[];
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
}

export interface TenantLifecycleRequest {
  reason_note?: string;
}
