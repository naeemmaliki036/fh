import { BaseRepository } from "./base.repository";
import type {
  OffMarketReason,
  OffMarketReasonCreateRequest,
  OffMarketReasonUpdateRequest,
} from "@/lib/types/off-market-reason";

export class OffMarketReasonRepository extends BaseRepository<
  OffMarketReason,
  OffMarketReasonCreateRequest,
  OffMarketReasonUpdateRequest
> {
  protected readonly basePath = "/off-market-reasons";

  async listAll(): Promise<OffMarketReason[]> {
    const res = await this.client.get<OffMarketReason[]>(this.basePath);
    return res.data;
  }

  async createReason(data: OffMarketReasonCreateRequest): Promise<OffMarketReason> {
    const res = await this.client.post<OffMarketReason>(this.basePath, data);
    return res.data;
  }

  async updateReason(id: string, data: OffMarketReasonUpdateRequest): Promise<OffMarketReason> {
    const res = await this.client.patch<OffMarketReason>(`${this.basePath}/${id}`, data);
    return res.data;
  }

  async deleteReason(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }
}

export const offMarketReasonRepository = new OffMarketReasonRepository();
