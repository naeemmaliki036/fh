// Marketplace types — mirrors apps/api/schemas/marketplace.py

export interface MarketplaceTenantSnippet {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  tagline: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

export interface MarketplaceListingItem {
  id: string;
  handle: string;
  title: string;
  short_description: string | null;
  price: number;
  currency: string;
  purpose: string;
  rent_period: string | null;
  rent_cheque_count: number | null;
  property_type: string;
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
  address: string | null;
  area: string | null;
  city: string | null;
  primary_photo_url: string | null;
  listing_tier: string | null;
  is_verified: boolean;
  price_per_sqft: number | null;
  price_drop_pct: number | null;
  days_since_posted: number;
  internal_reference: string | null;
  build_year: number | null;
  furnishing_status: string | null;
  completion_status: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_photo_url: string | null;
  agent_has_license: boolean;
  next_open_house_at: string | null;
  has_floor_plan: boolean;
  created_at: string;
  tenant: MarketplaceTenantSnippet;
}

export interface MarketplaceListingDetail extends MarketplaceListingItem {
  description: string | null;
  amenities: unknown[] | null;
  media_urls: string[];
  floor_plan_urls: string[];
  hero_media_url: string | null;
  lat: number | null;
  lng: number | null;
  view_orientation: string | null;
  handover_year: number | null;
  handover_quarter: number | null;
  payment_plan: string | null;
  upcoming_open_houses: Array<{ starts_at: string; ends_at: string; capacity: number | null }>;
  agent_email: string | null;
  agent_license_id: string | null;
  trakheesi_permit: string | null;
}

export interface MarketplaceAgencyItem {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  tagline: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  listings_count: number;
  agents_count: number;
}

export interface MarketplaceAgencyDetail extends MarketplaceAgencyItem {
  operating_countries: string[];
}

export interface MarketplaceStats {
  total_listings: number;
  total_agencies: number;
  by_type: Array<{ property_type: string; count: number }>;
}

export interface MarketplaceListingsParams {
  page?: number;
  page_size?: number;
  sort?: "verified_first" | "created_at_desc" | "price_asc" | "price_desc";
  purpose?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  beds?: number;
  baths?: number;
  city?: string;
  area?: string;
  amenities?: string;
  furnishing_status?: string;
  completion_status?: string;
  view_orientation?: string;
  is_verified?: boolean;
  rent_cheque_count?: number;
  min_build_year?: number;
  max_build_year?: number;
  has_floor_plan?: boolean;
  q?: string;
  tenant_slug?: string;
}

export interface MarketplaceListingsResponse {
  items: MarketplaceListingItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface MarketplaceAgenciesResponse {
  items: MarketplaceAgencyItem[];
  total: number;
  page: number;
  page_size: number;
}
