import { tenantApiClient } from "../client";
import type {
  TenantCommissionRate,
  CommissionRateListResponse,
  CommissionRateUpdateRequest,
  CommissionRateAuditEntry,
  TransactionType,
} from "@/lib/types/commission-rate";

export class CommissionRatesRepository {
  private readonly basePath = "/tenant/commission-rates";
  private readonly client = tenantApiClient;

  async list(): Promise<TenantCommissionRate[]> {
    const res = await this.client.get<CommissionRateListResponse>(this.basePath);
    return res.data.items;
  }

  async update(
    transactionType: TransactionType,
    body: CommissionRateUpdateRequest,
  ): Promise<TenantCommissionRate> {
    const res = await this.client.patch<TenantCommissionRate>(
      `${this.basePath}/${transactionType}`,
      body,
    );
    return res.data;
  }

  async getAudit(transactionType: TransactionType): Promise<CommissionRateAuditEntry[]> {
    const res = await this.client.get<CommissionRateAuditEntry[]>(
      `${this.basePath}/${transactionType}/audit`,
    );
    return res.data;
  }
}

export const commissionRatesRepository = new CommissionRatesRepository();
