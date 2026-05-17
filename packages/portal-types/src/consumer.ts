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

export type ConsumerListingStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "active"
  | "paused"
  | "sold"
  | "rented"
  | "archived"
  | "expired";

export type ConsumerListingPurpose = "sale" | "rent_long" | "rent_short";

export interface ConsumerListingMediaItem {
  id: string;
  url: string;
  kind: string;
  position: number;
}

export interface ConsumerMediaResponse {
  items: ConsumerListingMediaItem[];
  total: number;
}

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
  furnishing_status: string | null;
  completion_status: string | null;
  parking_spaces: number | null;
  floor_number: number | null;
  view_orientation: string | null;
  ownership_type: string | null;
  amenities: string[];
  attrs: Record<string, unknown>;
  status: ConsumerListingStatus;
  submitted_at: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  created_at: string;
  primary_photo_url: string | null;
  media: ConsumerListingMediaItem[];
  // marketplace shape fields for card reuse
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
}

export interface ConsumerListingCreateRequest {
  title?: string;
  description?: string;
  property_type: string;
  purpose: ConsumerListingPurpose;
  price?: number;
  currency?: string;
  country: string;
  city: string;
  area?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqft?: number | null;
  furnishing_status?: string | null;
  completion_status?: string | null;
  parking_spaces?: number | null;
  floor_number?: number | null;
  view_orientation?: string | null;
  ownership_type?: string | null;
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

// ---- Admin Moderation ----

export interface AdminConsumerListingQueueItem {
  id: string;
  title: string | null;
  property_type: string;
  purpose: ConsumerListingPurpose;
  price: number | null;
  currency: string | null;
  country: string;
  city: string;
  area: string | null;
  status: ConsumerListingStatus;
  submitted_at: string | null;
  review_notes: string | null;
  primary_photo_url: string | null;
  owner_email: string;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string;
}

export interface AdminConsumerListingQueueResponse {
  items: AdminConsumerListingQueueItem[];
  total: number;
}

export interface AdminConsumerListingDetail extends AdminConsumerListingQueueItem {
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  furnishing_status: string | null;
  completion_status: string | null;
  parking_spaces: number | null;
  floor_number: number | null;
  view_orientation: string | null;
  ownership_type: string | null;
  amenities: string[];
  reviewed_at: string | null;
  expires_at: string | null;
  media: ConsumerListingMediaItem[];
}

export interface ModerationActionResponse {
  id: string;
  status: ConsumerListingStatus;
}

export interface RequestChangesBody {
  notes: string;
}

export interface AdminConsumerListingQueueParams {
  status?: ConsumerListingStatus;
  page?: number;
  page_size?: number;
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
