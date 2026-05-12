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
  internal_reference: string | null;
  status: PropertyStatus;
  assigned_agents: PropertyAgentAssignment[];
  media_count: number;
  listing_count: number;
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
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
}

export interface PropertyListParams {
  status?: PropertyStatus;
  property_type?: PropertyType;
  city?: string;
  area?: string;
  q?: string;
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
