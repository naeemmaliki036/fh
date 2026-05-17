import { platformApiClient } from "../client";
import type {
  AdminConsumerListingDetail,
  AdminConsumerListingQueueParams,
  AdminConsumerListingQueueResponse,
  ModerationActionResponse,
  RequestChangesBody,
} from "@/lib/types";

class AdminConsumerListingsRepository {
  private readonly basePath = "/platform-admin/consumer-listings";

  async list(
    params?: AdminConsumerListingQueueParams,
  ): Promise<AdminConsumerListingQueueResponse> {
    const res = await platformApiClient.get<AdminConsumerListingQueueResponse>(
      this.basePath,
      { params },
    );
    return res.data;
  }

  async getDetail(id: string): Promise<AdminConsumerListingDetail> {
    const res = await platformApiClient.get<AdminConsumerListingDetail>(
      `${this.basePath}/${id}`,
    );
    return res.data;
  }

  async approve(id: string): Promise<ModerationActionResponse> {
    const res = await platformApiClient.post<ModerationActionResponse>(
      `${this.basePath}/${id}/approve`,
    );
    return res.data;
  }

  async requestChanges(
    id: string,
    body: RequestChangesBody,
  ): Promise<ModerationActionResponse> {
    const res = await platformApiClient.post<ModerationActionResponse>(
      `${this.basePath}/${id}/request-changes`,
      body,
    );
    return res.data;
  }
}

export const adminConsumerListingsRepository = new AdminConsumerListingsRepository();
