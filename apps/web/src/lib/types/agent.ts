export type AgentStatus = "active" | "inactive" | "on_leave";
export type CommissionType = "percentage" | "fixed";

export interface Agent {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo_key: string | null;
  photo_url: string | null;
  license_id: string | null;
  license_expiry_at: string | null;
  status: AgentStatus;
  default_commission_type: CommissionType;
  default_commission_value: string;
  linked_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCreateRequest {
  full_name: string;
  email: string;
  phone?: string | null;
  license_id?: string | null;
  license_expiry_at?: string | null;
  default_commission_type?: CommissionType;
  default_commission_value?: string | number;
  linked_user_id?: string | null;
}

export interface AgentUpdateRequest {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  license_id?: string | null;
  license_expiry_at?: string | null;
  default_commission_type?: CommissionType | null;
  default_commission_value?: string | number | null;
  linked_user_id?: string | null;
}

export interface AgentListResponse {
  items: Agent[];
  total: number;
}

export interface AgentListParams {
  status?: AgentStatus;
  q?: string;
  skip?: number;
  limit?: number;
}

export interface PhotoUploadResponse {
  photo_key: string;
  url: string;
}
