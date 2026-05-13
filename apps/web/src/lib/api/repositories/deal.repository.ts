import { BaseRepository } from "./base.repository";
import type {
  Deal,
  DealCreateRequest,
  DealUpdateRequest,
  DealListResponse,
  DealListParams,
  DealTransitionRequest,
  DealCommissionOverrideRequest,
  DealCommissionPayoutRequest,
} from "@/lib/types/deal";

export class DealRepository extends BaseRepository<Deal, DealCreateRequest, DealUpdateRequest> {
  protected readonly basePath = "/deals";

  async listDeals(params?: DealListParams): Promise<DealListResponse> {
    const res = await this.client.get<DealListResponse>(this.basePath, { params });
    return res.data;
  }

  async transition(id: string, body: DealTransitionRequest): Promise<Deal> {
    const res = await this.client.post<Deal>(`${this.basePath}/${id}/transition`, body);
    return res.data;
  }

  async overrideCommission(id: string, body: DealCommissionOverrideRequest): Promise<Deal> {
    const res = await this.client.post<Deal>(`${this.basePath}/${id}/commission`, body);
    return res.data;
  }

  async payoutCommission(id: string, body: DealCommissionPayoutRequest): Promise<Deal> {
    const res = await this.client.post<Deal>(`${this.basePath}/${id}/commission/payout`, body);
    return res.data;
  }

  async cancelCommissionPayout(id: string, reason_note: string): Promise<Deal> {
    const res = await this.client.post<Deal>(
      `${this.basePath}/${id}/commission/payout/cancel`,
      { reason_note },
    );
    return res.data;
  }
}

export const dealRepository = new DealRepository();
