export type AuditAction =
  | "tenant_created"
  | "tenant_approved"
  | "tenant_rejected"
  | "tenant_suspended"
  | "tenant_reactivated"
  | "user_created"
  | "user_role_changed"
  | "user_status_changed"
  | "user_deactivated"
  | "user_reactivated"
  | "agent_created"
  | "agent_status_changed"
  | "property_created"
  | "property_updated"
  | "property_status_changed"
  | "property_tags_changed"
  | "listing_created"
  | "listing_status_changed"
  | "listing_price_changed"
  | "listing_hero_media_set"
  | "listing_document_uploaded"
  | "listing_document_deleted"
  | "lead_created"
  | "deal_created"
  | "deal_stage_changed"
  | "commission_overridden"
  | "platform_user_created"
  | "platform_user_updated"
  | "platform_user_role_changed"
  | "platform_user_password_reset"
  | "document_accessed"
  | "document_uploaded"
  | "document_deleted"
  | "other";

export interface AuditLogActor {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  action: AuditAction;
  actor_user_id: string | null;
  actor_platform_user_id: string | null;
  actor: AuditLogActor | null;
  metadata_before: Record<string, unknown> | null;
  metadata_after: Record<string, unknown> | null;
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
  offset?: number;
}
