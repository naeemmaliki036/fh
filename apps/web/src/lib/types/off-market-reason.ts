export interface OffMarketReason {
  id: string;
  tenant_id: string | null; // null = platform default
  code: string;
  label: string;
  requires_note: boolean;
  ordering: number;
  is_platform_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface OffMarketReasonCreateRequest {
  label: string;
  code: string;
  requires_note?: boolean;
  ordering?: number;
}

export interface OffMarketReasonUpdateRequest {
  label?: string;
  requires_note?: boolean;
  ordering?: number;
}
