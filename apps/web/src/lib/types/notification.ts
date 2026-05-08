export type NotificationKind =
  | "tenant_registered"
  | "tenant_approved"
  | "tenant_suspended"
  | "deal_created"
  | "lead_assigned"
  | "system";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link_path: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  has_more: boolean;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationListParams {
  limit?: number;
  before_id?: string;
}
