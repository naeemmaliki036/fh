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
  approved_at: string | null;
  approved_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantUpdateRequest {
  name?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  default_properties_view?: PropertiesViewMode;
}

export interface TenantListResponse {
  items: Tenant[];
  total: number;
}
