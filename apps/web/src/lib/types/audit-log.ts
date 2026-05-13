export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "price_changed"
  | "document_accessed"
  | "document_uploaded"
  | "document_deleted"
  | "commission_overridden"
  | "hero_media_set"
  | "other";

export interface AuditLog {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  actor_id: string | null;
  actor_name: string | null;
  reason_note: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
}

export interface AuditLogListParams {
  entity_type?: string;
  entity_id?: string;
  action?: AuditAction;
  limit?: number;
  skip?: number;
}
