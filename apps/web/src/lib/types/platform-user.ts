export type PlatformRole = "super_admin" | "operations_admin" | "finance_admin";

export interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  role: PlatformRole;
  is_platform: boolean;
}
