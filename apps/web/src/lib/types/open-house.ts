export type OpenHouseStatus = "scheduled" | "cancelled" | "completed";

export interface OpenHouse {
  id: string;
  listing_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  notes: string | null;
  status: OpenHouseStatus;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenHouseCreate {
  starts_at: string;
  ends_at: string;
  capacity?: number | null;
  notes?: string | null;
}

export interface OpenHouseUpdate {
  starts_at?: string | null;
  ends_at?: string | null;
  capacity?: number | null;
  notes?: string | null;
}

export interface OpenHouseCancelRequest {
  reason?: string | null;
}

export interface OpenHouseListResponse {
  items: OpenHouse[];
  total: number;
}

export interface OpenHouseListParams {
  include_past?: boolean;
}
