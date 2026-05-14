export interface Country {
  id: string;
  code: string;
  name: string;
  currency: string | null;
  flag_emoji: string | null;
  active: boolean;
  ordering: number;
  created_at: string;
  updated_at: string;
}

export interface CountryWithCounts extends Country {
  city_count: number;
  area_count: number;
}

export interface City {
  id: string;
  country_id: string;
  slug: string;
  label: string;
  active: boolean;
  ordering: number;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  city_id: string;
  slug: string;
  label: string;
  active: boolean;
  ordering: number;
  created_at: string;
  updated_at: string;
}

export interface AreaSlim {
  id: string;
  slug: string;
  label: string;
  ordering: number;
}

export interface CitySlim {
  id: string;
  slug: string;
  label: string;
  ordering: number;
  areas: AreaSlim[];
}

export interface CountryTree {
  id: string;
  code: string;
  name: string;
  currency: string | null;
  flag_emoji: string | null;
  ordering: number;
  cities: CitySlim[];
}

// ---- Write types ----

export interface CountryCreateRequest {
  code: string;
  name: string;
  currency?: string | null;
  flag_emoji?: string | null;
  ordering?: number;
}

export interface CountryUpdateRequest {
  name?: string;
  currency?: string | null;
  flag_emoji?: string | null;
  active?: boolean;
  ordering?: number;
}

export interface CityCreateRequest {
  slug: string;
  label: string;
  ordering?: number;
}

export interface CityUpdateRequest {
  label?: string;
  active?: boolean;
  ordering?: number;
}

export interface AreaCreateRequest {
  slug: string;
  label: string;
  ordering?: number;
}

export interface AreaUpdateRequest {
  label?: string;
  active?: boolean;
  ordering?: number;
}

export interface AreaBulkItem {
  slug: string;
  label: string;
}

export interface AreaBulkCreateRequest {
  city_id: string;
  items: AreaBulkItem[];
}
