export type PlatformRole = "super_admin" | "operations_admin" | "finance_admin" | "support_admin";
export type PlatformUserStatus = "active" | "disabled";

export interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  role: PlatformRole;
  status: PlatformUserStatus;
  is_platform: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface PlatformUserCreateRequest {
  email: string;
  full_name: string;
  role: PlatformRole;
  password: string;
}

export interface PlatformUserUpdateRequest {
  full_name?: string;
  role?: PlatformRole;
  status?: PlatformUserStatus;
}

export interface PlatformUserResetPasswordRequest {
  new_password: string;
}

export interface PlatformUserListResponse {
  items: PlatformUser[];
  total: number;
}
