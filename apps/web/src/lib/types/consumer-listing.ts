// Admin-side consumer listing types for the platform portal.
// Defined inline (apps/web does not depend on @fh/portal-types).

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

export interface ConsumerListingMediaItem {
  id: string;
  url: string;
  kind: string;
  position: number;
}

export interface AdminConsumerListingQueueItem {
  id: string;
  title: string | null;
  property_type: string;
  purpose: "sale" | "rent_long" | "rent_short";
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
