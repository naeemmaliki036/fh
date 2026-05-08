export interface LoginRequest {
  email: string;
  password: string;
}

export interface PlatformLoginRequest {
  email: string;
  password: string;
}

export interface RegisterTenantRequest {
  tenant_name: string;
  tenant_slug: string;
  currency?: string;
  timezone?: string;
  locale?: string;
  owner_email: string;
  owner_password: string;
  owner_full_name: string;
  contact_email: string;
  contact_phone: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

export interface LoginResponse extends TokenResponse {
  user: AuthUserResponse;
}

export interface PlatformUserAuthPayload {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_platform: boolean;
}

export interface PlatformLoginResponse extends TokenResponse {
  user: PlatformUserAuthPayload;
}

export interface RegisterTenantResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    currency: string;
    timezone: string;
    locale: string;
  };
  user: AuthUserResponse;
  message: string;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_platform: boolean;
  tenant_id: string | null;
}

export interface JwtClaims {
  sub: string;
  tenant_id: string | null;
  email: string;
  role: string;
  is_platform: boolean;
  type: "access" | "refresh";
  exp: number;
  iat: number;
}
