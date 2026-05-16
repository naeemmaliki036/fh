// Marketplace types — mirrors apps/api/schemas/marketplace.py

export interface MarketplaceCountryItem {
  code: string;
  tenant_count: number;
}

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

// Matches MarketplaceListingItem in apps/api/schemas/marketplace.py.
// Fields dropped: handle, address, rent_period, rent_cheque_count,
// days_since_posted, furnishing_status, completion_status, has_floor_plan.
export interface MarketplaceListingItem {
  id: string;
  title: string;
  short_description: string | null;
  price: number;
  currency: string;
  purpose: string;
  property_type: string;
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
  area: string | null;
  city: string | null;
  primary_photo_url: string | null;
  listing_tier: string | null;
  is_verified: boolean;
  price_per_sqft: number | null;
  price_drop_pct: number | null;
  internal_reference: string | null;
  build_year: number | null;
  agent_name: string | null;
  agent_phone: string | null;
  agent_photo_url: string | null;
  agent_has_license: boolean;
  next_open_house_at: string | null;
  created_at: string | null;
  tenant: MarketplaceTenantSnippet;
}

// Matches MarketplaceListingDetailResponse in apps/api/schemas/marketplace.py.
export interface MarketplaceListingDetail {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number;
  currency: string;
  purpose: string;
  status: string;
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
  plot_area_sqft: number | null;
  address: string | null;
  area: string | null;
  city: string | null;
  country_name: string | null;
  lat: number | null;
  lng: number | null;
  internal_reference: string | null;
  build_year: number | null;
  property_type: string;
  furnishing_status: string | null;
  completion_status: string | null;
  parking_spaces: number | null;
  service_charge_per_sqft: number | null;
  rera_permit: string | null;
  trakheesi: string | null;
  ownership_type: string | null;
  amenities: string[] | null;
  tags: string[];
  media_urls: string[];
  floor_plan_urls: string[];
  hero_media_url: string | null;
  agent: unknown | null;
  next_open_house: unknown | null;
  upcoming_open_houses: Array<{ starts_at: string; ends_at: string; capacity: number | null }>;
  handover_year: number | null;
  handover_quarter: number | null;
  payment_plan: boolean;
  verified_at: string | null;
  tenant: MarketplaceTenantSnippet;
  // Fields shared with list item — derived or optional
  is_verified?: boolean;
  listing_tier?: string | null;
  is_verified_listing?: boolean;
  price_per_sqft?: number | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_photo_url?: string | null;
  agent_has_license?: boolean;
  agent_email?: string | null;
  agent_whatsapp?: string | null;
  created_at?: string | null;
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
  description: string | null;
}

export interface MarketplaceAgenciesParams {
  page?: number;
  page_size?: number;
  q?: string;
  country?: string;
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
  country?: string;
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
