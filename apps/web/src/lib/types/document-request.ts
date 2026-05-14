export type DocumentRequestStatus =
  | "pending" | "partial" | "complete" | "expired" | "canceled";

export interface DocumentRequestItemResponse {
  id: string;
  document_request_id: string;
  kind: string;
  label: string;
  is_required: boolean;
  ordering: number;
  uploaded_document_id: string | null;
  uploaded_at: string | null;
}

export interface DocumentRequest {
  id: string;
  tenant_id: string;
  customer_id: string;
  lead_id: string | null;
  deal_id: string | null;
  title: string;
  instructions: string | null;
  token: string;
  status: DocumentRequestStatus;
  expires_at: string;
  verified_at: string | null;
  verification_attempts: number;
  created_by_user_id: string;
  items: DocumentRequestItemResponse[];
  items_count: number;
  uploaded_count: number;
  created_at: string;
  updated_at: string;
}

/** Returned only on create — includes plaintext code + public_url once. */
export interface DocumentRequestCreateResponse extends DocumentRequest {
  verification_code: string;
  public_url: string;
}

export interface DocumentRequestItemCreate {
  kind: string;
  label: string;
  is_required?: boolean;
  ordering?: number;
}

export interface DocumentRequestCreate {
  customer_id: string;
  title: string;
  items: DocumentRequestItemCreate[];
  lead_id?: string | null;
  deal_id?: string | null;
  property_id?: string | null;
  agent_note?: string | null;
  instructions?: string | null;
  expires_in_days?: number;
}

export interface DocumentRequestListResponse {
  items: DocumentRequest[];
  total: number;
}

export interface DocumentRequestListParams {
  status?: DocumentRequestStatus;
  customer_id?: string;
  lead_id?: string;
  deal_id?: string;
  skip?: number;
  limit?: number;
}

export interface RegenerateCodeResponse {
  verification_code: string;
  message: string;
}
