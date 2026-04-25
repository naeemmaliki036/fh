export type PrivateDocumentKind =
  | "rera_id"
  | "passport"
  | "emirates_id"
  | "trade_license"
  | "noc"
  | "contract"
  | "kyc"
  | "other";

export type PrivateDocumentEntityType = "agent" | "customer" | "deal" | "tenant";

export interface PrivateDocument {
  id: string;
  tenant_id: string;
  entity_type: PrivateDocumentEntityType;
  entity_id: string;
  kind: PrivateDocumentKind;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_user_id: string | null;
  uploaded_by_platform_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrivateDocumentListResponse {
  items: PrivateDocument[];
  total: number;
}

export interface DownloadUrlResponse {
  signed_url: string;
  expires_in: number;
}
