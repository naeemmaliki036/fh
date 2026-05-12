export type ListingPurpose = "sale" | "rent_short" | "rent_long";
export type RentPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type ListingStatus = "draft" | "active" | "paused" | "expired" | "archived";
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
