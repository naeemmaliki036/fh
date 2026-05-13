export type PropertyType =
  | "apartment" | "villa" | "townhouse" | "penthouse"
  | "office" | "retail" | "warehouse" | "plot" | "building" | "other";

export type PropertyStatus =
  | "draft" | "available" | "reserved" | "sold" | "rented" | "off_market";

export interface PropertyAgentAssignment {
  property_id: string;
  agent_id: string;
  is_primary: boolean;
  assigned_at: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: string | null;
  price: string | null;
  currency: string | null;
  address_line: string | null;
  city: string | null;
  area: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  amenities: string[] | null;
  tags: string[] | null;
  internal_reference: string | null;
  status: PropertyStatus;
  assigned_agents: PropertyAgentAssignment[];
  media_count: number;
  listing_count: number;
  thumbnail_url?: string | null;
  thumbnail_kind?: "image" | "video" | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreateRequest {
  title: string;
  property_type: PropertyType;
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqft?: string | null;
  price?: string | null;
  currency?: string | null;
  address_line?: string | null;
  city?: string | null;
  area?: string | null;
  country?: string | null;
  internal_reference?: string | null;
  tags?: string[] | null;
  amenities?: Record<string, unknown> | null;
  agent_ids?: string[] | null;
}

export interface PropertyUpdateRequest {
  title?: string | null;
  description?: string | null;
  property_type?: PropertyType | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqft?: string | null;
  price?: string | null;
  currency?: string | null;
  address_line?: string | null;
  city?: string | null;
  area?: string | null;
  country?: string | null;
  status?: PropertyStatus | null;
  internal_reference?: string | null;
  tags?: string[] | null;
  amenities?: Record<string, unknown> | null;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
}

export interface PropertyListParams {
  status?: PropertyStatus;
  property_type?: PropertyType;
  country?: string;
  city?: string;
  area?: string;
  assigned_agent_id?: string;
  min_price?: string;
  max_price?: string;
  currency?: string;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_size_sqft?: string;
  max_size_sqft?: string;
  tags?: string;
  created_from?: string;
  created_to?: string;
  has_listing?: boolean;
  q?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  skip?: number;
  limit?: number;
}

export interface PropertyAgentAssignRequest {
  agent_id: string;
  is_primary?: boolean;
}

export interface PropertyAgentPatchRequest {
  is_primary: boolean;
}

export interface PropertyStatusChangeRequest {
  status: PropertyStatus;
  reason_code: string;
  reason_note: string | null;
}
