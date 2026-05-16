export interface MarketplaceCountry {
  id: string;
  code: string;
  name: string;
  flag_emoji: string;
  display_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCountryListResponse {
  items: MarketplaceCountry[];
  total: number;
}

export interface MarketplaceCountryCreateRequest {
  code: string;
  name: string;
  flag_emoji: string;
  display_order?: number;
  enabled?: boolean;
}

export interface MarketplaceCountryUpdateRequest {
  name?: string;
  flag_emoji?: string;
  display_order?: number;
  enabled?: boolean;
}
