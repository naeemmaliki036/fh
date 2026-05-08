import { platformApiClient } from "../client";
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  NotificationListParams,
} from "@/lib/types";

export class NotificationRepository {
  private readonly basePath = "/platform/notifications";

  async list(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    const res = await platformApiClient.get<NotificationListResponse>(this.basePath, { params });
    return res.data;
  }

  async unreadCount(): Promise<UnreadCountResponse> {
    const res = await platformApiClient.get<UnreadCountResponse>(
      `${this.basePath}/unread-count`,
    );
    return res.data;
  }

  async markRead(id: string): Promise<Notification> {
    const res = await platformApiClient.post<Notification>(
      `${this.basePath}/${id}/mark-read`,
    );
    return res.data;
  }

  async markAllRead(): Promise<void> {
    await platformApiClient.post(`${this.basePath}/read-all`);
  }
}

export const notificationRepository = new NotificationRepository();
