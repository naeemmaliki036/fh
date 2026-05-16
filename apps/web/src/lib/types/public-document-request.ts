import type { PrivateDocumentKind } from "./private-document";
import type { DocumentRequestStatus } from "./document-request";

export interface PublicItemResponse {
  id: string;
  kind: PrivateDocumentKind;
  label: string;
  is_required: boolean;
  uploaded: boolean;
  uploaded_at: string | null;
}

export interface PublicDocumentRequestResponse {
  title: string;
  instructions: string | null;
  tenant_name: string;
  customer_name: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  status: DocumentRequestStatus;
  expires_at: string;
  closed_at: string | null;
  verified: boolean;
  items: PublicItemResponse[];
}

export interface VerifyRequest {
  code: string;
}

export interface VerifyResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UploadItemResponse {
  item_id: string;
  uploaded: boolean;
  uploaded_at: string;
  request_status: DocumentRequestStatus;
}
