// Public-facing site types — mirrors apps/api/schemas/public_site.py

export interface PublicTenantProfile {
  name: string;
  logo_url: string | null;
  tagline: string | null;
  contact_email: string;
  contact_phone: string;
}

export interface PublicListingItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
  address: string | null;
  property_type: string;
  primary_photo_url: string | null;
  purpose: string;
}

export interface PublicListingListResponse {
  items: PublicListingItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface PublicAgentSnippet {
  id: string;
  full_name: string;
  photo_url: string | null;
  phone: string | null;
  email: string;
}

export interface PublicListingDetail {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  purpose: string;
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
  address: string | null;
  property_type: string;
  amenities: unknown[] | null;
  media_urls: string[];
  agent: PublicAgentSnippet | null;
}

export interface PublicLeadCreate {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  listing_id?: string | null;
}

export interface PublicLeadResponse {
  id: string;
}

// Admin: public-site settings
export interface PublicSiteSettings {
  slug: string;
  public_site_enabled: boolean;
  public_site_logo_url: string | null;
  public_site_tagline: string | null;
  public_url_hint: string;
}

export interface PublicSiteSettingsUpdate {
  public_site_enabled?: boolean | null;
  public_site_logo_url?: string | null;
  public_site_tagline?: string | null;
}

export interface PublicListingsParams {
  page?: number;
  page_size?: number;
  min_price?: number | null;
  max_price?: number | null;
  beds?: number | null;
  property_type?: string | null;
}
