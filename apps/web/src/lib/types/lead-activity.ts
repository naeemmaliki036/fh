export type LeadActivityKind =
  | "note"
  | "stage_changed"
  | "assignment_changed"
  | "contact_made"
  | "viewing_scheduled"
  | "viewing_completed"
  | "offer_made"
  | "offer_accepted"
  | "offer_rejected"
  | "other";

/** Kinds a user can manually create (server rejects system kinds). */
export const MANUAL_ACTIVITY_KINDS: LeadActivityKind[] = [
  "note",
  "contact_made",
  "viewing_scheduled",
  "viewing_completed",
  "offer_made",
  "offer_accepted",
  "offer_rejected",
  "other",
];

export interface LeadActivity {
  id: string;
  lead_id: string;
  tenant_id: string;
  kind: LeadActivityKind;
  description: string | null;
  activity_metadata: Record<string, unknown> | null;
  actor_user_id: string | null;
  actor_full_name: string | null;
  created_at: string;
}

export interface LeadActivityCreateRequest {
  kind: LeadActivityKind;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LeadActivityListResponse {
  items: LeadActivity[];
  total: number;
}
