// Consumer portal types — mirrors apps/api/routers/consumer/

export interface ConsumerResponse {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  last_login_at: string | null;
  listings_count: number;
  favorites_count: number;
}

export interface ConsumerAuthResponse {
  access_token: string;
  consumer: ConsumerResponse;
}

export interface RequestOtpResponse {
  sent: boolean;
  dev_otp: string | null;
}

export interface RequestOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
  full_name?: string;
  phone?: string;
}

export interface ConsumerUpdateRequest {
  full_name?: string;
  phone?: string;
}

// ---- Consumer Listings ----

export type ConsumerListingStatus = "active" | "paused" | "sold" | "rented" | "archived";
export type ConsumerListingPurpose = "sale" | "rent_long" | "rent_short";

export interface ConsumerListingItem {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  purpose: ConsumerListingPurpose;
  price: number;
  currency: string;
  country: string;
  city: string;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  status: ConsumerListingStatus;
  expires_at: string | null;
  created_at: string;
  primary_photo_url: string | null;
  // marketplace shape fields for card reuse
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
}

export interface ConsumerListingCreateRequest {
  title: string;
  description?: string;
  property_type: string;
  purpose: ConsumerListingPurpose;
  price: number;
  currency: string;
  country: string;
  city: string;
  area?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqft?: number | null;
  amenities?: string[];
  attrs?: Record<string, unknown>;
}

export interface ConsumerListingUpdateRequest extends Partial<ConsumerListingCreateRequest> {}

export interface ConsumerListingMarkStatusRequest {
  status: "sold" | "rented" | "paused" | "active";
}

export interface ConsumerListingsResponse {
  items: ConsumerListingItem[];
  total: number;
  active_count: number;
}

// ---- Favorites ----

export interface FavoriteToggleResponse {
  favorited: boolean;
  favorites_count: number;
}

// ---- Consumer Inquiry ----

export interface ConsumerListingLeadRequest {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_message?: string;
}

export interface ConsumerListingLeadResponse {
  lead_id: string;
  seller_contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}
