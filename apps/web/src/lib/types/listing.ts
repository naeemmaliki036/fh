export type ListingPurpose = "sale" | "rent_short" | "rent_long";
export type RentPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type ListingStatus = "draft" | "active" | "paused" | "expired" | "archived" | "sold" | "rented" | "off_market";
export type ListingTier = "standard" | "premium" | "featured";

export interface Listing {
  id: string;
  tenant_id: string;
  property_id: string;
  purpose: ListingPurpose;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  rent_period: RentPeriod | null;
  status: ListingStatus;
  listing_tier: ListingTier;
  hero_media_id: string | null;
  hero_media_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_kind?: "image" | "video" | null;
  tags: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingCreateRequest {
  purpose: ListingPurpose;
  title: string;
  price: string | number;
  currency: string;
  description?: string | null;
  rent_period?: RentPeriod | null;
  status?: ListingStatus;
  listing_tier?: ListingTier;
  valid_from?: string | null;
  valid_until?: string | null;
}

export interface ListingUpdateRequest {
  purpose?: ListingPurpose | null;
  title?: string | null;
  description?: string | null;
  price?: string | number | null;
  currency?: string | null;
  rent_period?: RentPeriod | null;
  listing_tier?: ListingTier | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

export interface ListingListResponse {
  items: Listing[];
  total: number;
}

export interface ListingStatusChangeRequest {
  status: ListingStatus;
  reason_code: string;
  reason_note: string | null;
}

export interface ListingListParams {
  status?: ListingStatus;
  purpose?: ListingPurpose;
  listing_tier?: ListingTier;
  assigned_agent_id?: string;
  min_price?: string;
  max_price?: string;
  currency?: string;
  country?: string;
  city?: string;
  area?: string;
  created_from?: string;
  created_to?: string;
  q?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  skip?: number;
  limit?: number;
}
