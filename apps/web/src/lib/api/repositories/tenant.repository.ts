import type { AxiosInstance } from "axios";
import { platformApiClient, tenantApiClient } from "../client";
import { BaseRepository } from "./base.repository";
import type { Tenant, TenantListResponse, TenantUpdateRequest, PropertyRefPrefixRequest } from "@/lib/types";

export class TenantRepository extends BaseRepository<Tenant, never, TenantUpdateRequest> {
  protected readonly basePath = "/tenants";

  // Uses platformApiClient for platform-admin endpoints
  private readonly platformClient: AxiosInstance;

  constructor(
    tenantClient: AxiosInstance = tenantApiClient,
    platformClient: AxiosInstance = platformApiClient,
  ) {
    super(tenantClient);
    this.platformClient = platformClient;
  }

  async listTenants(status?: string): Promise<TenantListResponse> {
    const params = status ? { status } : undefined;
    const res = await this.platformClient.get<TenantListResponse>(this.basePath, { params });
    return res.data;
  }

  async approve(id: string): Promise<Tenant> {
    const res = await this.platformClient.post<Tenant>(
      `${this.basePath}/${id}/approve`,
    );
    return res.data;
  }

  async suspend(id: string): Promise<Tenant> {
    const res = await this.platformClient.post<Tenant>(
      `${this.basePath}/${id}/suspend`,
    );
    return res.data;
  }

  async getMyTenant(): Promise<Tenant> {
    const res = await this.client.get<Tenant>(`${this.basePath}/me`);
    return res.data;
  }

  async updateMyTenant(data: TenantUpdateRequest): Promise<Tenant> {
    const res = await this.client.patch<Tenant>(`${this.basePath}/me`, data);
    return res.data;
  }

  async updatePropertyRefPrefix(_tenantId: string, data: PropertyRefPrefixRequest): Promise<Tenant> {
    const res = await this.client.patch<Tenant>(`${this.basePath}/me`, data);
    return res.data;
  }
}

export const tenantRepository = new TenantRepository();
