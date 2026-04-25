export type TenantRole =
  | "company_owner"
  | "company_admin"
  | "property_admin"
  | "listing_manager"
  | "agent"
  | "finance_user"
  | "read_only";

export type UserStatus = "active" | "disabled";

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: TenantRole;
  status: UserStatus;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  role: TenantRole;
  phone?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  phone?: string;
  role?: TenantRole;
}

export interface UserMeUpdateRequest {
  full_name?: string;
  phone?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
}
