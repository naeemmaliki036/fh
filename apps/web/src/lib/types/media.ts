export type MediaKind = "image" | "video" | "floorplan" | "brochure";

export interface Media {
  id: string;
  tenant_id: string;
  property_id: string;
  kind: MediaKind;
  storage_key: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  ordering: number;
  alt_text: string | null;
  variants: Record<string, unknown> | null;
  width: number | null;
  height: number | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaUpdateRequest {
  ordering?: number | null;
  alt_text?: string | null;
}

export interface MediaListResponse {
  items: Media[];
  total: number;
}

export interface MediaReorderRequest {
  ordered_ids: string[];
}
