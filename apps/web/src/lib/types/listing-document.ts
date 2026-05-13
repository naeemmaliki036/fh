export type ListingDocumentKind =
  | "brochure"
  | "floor_plan"
  | "payment_plan"
  | "other";

export interface ListingDocument {
  id: string;
  listing_id: string;
  kind: ListingDocumentKind;
  name: string | null;
  storage_key: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_user_id: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface ListingDocumentListResponse {
  items: ListingDocument[];
  total: number;
}

export interface ListingDocumentUploadRequest {
  file: File;
  kind: ListingDocumentKind;
  name?: string;
}
