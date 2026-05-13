export interface ListingPriceChangeRequest {
  new_price: string | number;
  reason_note: string;
}

export interface ListingPriceHistoryEntry {
  id: string;
  listing_id: string;
  old_price: string | null;
  new_price: string;
  currency: string;
  reason_note: string | null;
  changed_by_user_id: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export interface ListingPriceHistoryResponse {
  items: ListingPriceHistoryEntry[];
  total: number;
}

export interface ListingHeroMediaRequest {
  media_id: string;
}
