// Public-facing site types — mirrors apps/api/schemas/public_site.py

export interface PublicSiteStats {
  listings_count: number;
  agents_count: number;
  featured_area: string | null;
  inventory_value_aed: number | null;
}

// ---------------------------------------------------------------------------
// Config sub-types — mirrors apps/api/schemas/public_site_config.py
// ---------------------------------------------------------------------------

export interface HeroConfig {
  headline: string | null;
  subheadline: string | null;
  eyebrow: string | null;
  image_url: string | null;
}

export interface ThemeConfig {
  primary_color: string | null;
  accent_color: string | null;
}

export interface ServiceCard {
  title: string;
  description: string;
}

export interface ServicesConfig {
  enabled: boolean;
  title: string | null;
  subtitle: string | null;
  cards: ServiceCard[] | null;
}

export interface TeamMember {
  name: string;
  title: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  linkedin_url: string | null;
}

export interface TeamConfig {
  title: string | null;
  subtitle: string | null;
  members: TeamMember[];
  show_agents: boolean;
}

export interface FooterConfig {
  description: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
}

export interface SectionsConfig {
  services_enabled: boolean;
  team_enabled: boolean;
  contact_enabled: boolean;
}

export interface ContactSectionConfig {
  title: string | null;
  headline: string | null;
  whatsapp: string | null;
}

export interface RawSiteConfig {
  hero?: Partial<HeroConfig> | null;
  theme?: Partial<ThemeConfig> | null;
  services?: Partial<ServicesConfig> | null;
  team?: Partial<TeamConfig> | null;
  footer?: Partial<FooterConfig> | null;
  sections?: Partial<SectionsConfig> | null;
  contact?: Partial<ContactSectionConfig> | null;
}

export interface ResolvedSiteConfig {
  hero: HeroConfig;
  theme: ThemeConfig;
  services: ServicesConfig;
  team: TeamConfig;
  footer: FooterConfig;
  sections: SectionsConfig;
  contact: ContactSectionConfig;
}

// ---------------------------------------------------------------------------
// Public profile
// ---------------------------------------------------------------------------

export interface PublicTenantProfile {
  name: string;
  logo_url: string | null;
  tagline: string | null;
  contact_email: string;
  contact_phone: string;
  /** ISO-3166-1 alpha-2 country codes where the tenant operates */
  operating_countries: string[];
  stats?: PublicSiteStats;
  config?: RawSiteConfig | null;
}

export interface PublicListingItem {
  id: string;
  title: string;
  short_description: string | null;
  price: number;
  currency: string;
  beds: number | null;
  baths: number | null;
  area_sqft: number | null;
  address: string | null;
  property_type: string;
  primary_photo_url: string | null;
  purpose: string;
  listing_tier?: string | null;
  created_at?: string | null;
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
  license_id?: string | null;
}

export interface PublicListingDetail {
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
  config: RawSiteConfig;
  // Per-tenant media limits (read-only for tenant owners)
  max_images_per_property: number;
  max_videos_per_property: number;
  max_image_mb: number;
  max_video_mb: number;
}

export interface PublicSiteSettingsUpdate {
  public_site_enabled?: boolean | null;
  public_site_logo_url?: string | null;
  public_site_tagline?: string | null;
  config?: RawSiteConfig | null;
}

export interface PublicListingsParams {
  page?: number;
  page_size?: number;
  q?: string | null;
  purpose?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  beds?: number | null;
  min_bedrooms?: number | null;
  max_bedrooms?: number | null;
  property_type?: string | null;
  city?: string | null;
  area?: string | null;
}
