import type { AxiosInstance } from "axios";
import {
  tenantApiClient,
  platformApiClient,
  setTenantTokens,
  setPlatformTokens,
  clearTenantTokens,
  clearPlatformTokens,
} from "../client";
import type {
  LoginRequest,
  LoginResponse,
  PlatformLoginRequest,
  PlatformLoginResponse,
  RegisterTenantRequest,
  RegisterTenantResponse,
  TokenResponse,
  MeResponse,
} from "@/lib/types";

export class AuthRepository {
  private readonly tenantClient: AxiosInstance;
  private readonly platformClient: AxiosInstance;

  constructor(
    tenantClient: AxiosInstance = tenantApiClient,
    platformClient: AxiosInstance = platformApiClient,
  ) {
    this.tenantClient = tenantClient;
    this.platformClient = platformClient;
  }

  async registerTenant(data: RegisterTenantRequest): Promise<RegisterTenantResponse> {
    const res = await this.tenantClient.post<RegisterTenantResponse>(
      "/auth/register-tenant",
      data,
    );
    return res.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await this.tenantClient.post<LoginResponse>("/auth/login", data);
    setTenantTokens(res.data.access_token, res.data.refresh_token);
    return res.data;
  }

  async platformLogin(data: PlatformLoginRequest): Promise<PlatformLoginResponse> {
    const res = await this.platformClient.post<PlatformLoginResponse>(
      "/auth/platform-login",
      data,
    );
    setPlatformTokens(res.data.access_token, res.data.refresh_token);
    return res.data;
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const res = await this.tenantClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data;
  }

  async me(): Promise<MeResponse> {
    const res = await this.tenantClient.get<MeResponse>("/auth/me");
    return res.data;
  }

  async platformMe(): Promise<MeResponse> {
    const res = await this.platformClient.get<MeResponse>("/auth/platform/me");
    return res.data;
  }

  logout(): void {
    clearTenantTokens();
  }

  platformLogout(): void {
    clearPlatformTokens();
  }
}

export const authRepository = new AuthRepository();
