import { platformApiClient } from "../client";
import type {
  TenantDetailResponse,
  TenantListParams,
  TenantListResponse,
  TenantLifecycleRequest,
  TenantMediaLimitsRequest,
  TenantSendMessageRequest,
  Tenant,
} from "@/lib/types";

class TenantAdminRepository {
  private readonly basePath = "/tenants";

  async list(params?: TenantListParams): Promise<TenantListResponse> {
    const res = await platformApiClient.get<TenantListResponse>(this.basePath, { params });
    return res.data;
  }

  async getDetail(id: string): Promise<TenantDetailResponse> {
    const res = await platformApiClient.get<TenantDetailResponse>(`${this.basePath}/${id}`);
    return res.data;
  }

  async approve(id: string): Promise<Tenant> {
    const res = await platformApiClient.post<Tenant>(`${this.basePath}/${id}/approve`, {});
    return res.data;
  }

  async reject(id: string, body: TenantLifecycleRequest): Promise<Tenant> {
    const res = await platformApiClient.post<Tenant>(`${this.basePath}/${id}/reject`, body);
    return res.data;
  }

  async suspend(id: string, body: TenantLifecycleRequest): Promise<Tenant> {
    const res = await platformApiClient.post<Tenant>(`${this.basePath}/${id}/suspend`, body);
    return res.data;
  }

  async reactivate(id: string, body?: TenantLifecycleRequest): Promise<Tenant> {
    const res = await platformApiClient.post<Tenant>(
      `${this.basePath}/${id}/reactivate`,
      body ?? {},
    );
    return res.data;
  }

  async sendMessage(id: string, body: TenantSendMessageRequest): Promise<void> {
    await platformApiClient.post(`${this.basePath}/${id}/send-message`, body);
  }

  async setMediaLimits(id: string, body: TenantMediaLimitsRequest): Promise<Tenant> {
    const res = await platformApiClient.post<Tenant>(
      `${this.basePath}/${id}/media-limits`,
      body,
    );
    return res.data;
  }
}

export const tenantAdminRepository = new TenantAdminRepository();
