export type PropertyType =
  | "apartment" | "villa" | "townhouse" | "penthouse"
  | "office" | "retail" | "warehouse" | "plot" | "building" | "other";

export type PropertyStatus =
  | "draft" | "available" | "reserved" | "sold" | "rented" | "off_market";

export type FurnishingStatus = "furnished" | "semi_furnished" | "unfurnished";
export type CompletionStatus = "ready" | "off_plan";
export type OwnershipType = "freehold" | "leasehold" | "gcc_only";
export type ViewOrientation =
  | "sea" | "marina" | "canal" | "lake" | "creek"
  | "city" | "garden" | "pool" | "golf" | "landmark" | "partial" | "none";
export type FloorLevel = "low" | "mid" | "high";
export type FitOutStatus = "fitted" | "shell_and_core" | "partially_fitted";

export interface PropertyAgentAssignment {
  property_id: string;
  agent_id: string;
  is_primary: boolean;
  assigned_at: string;
}

export interface PropertyAgentDetail {
  property_id: string;
  agent_id: string;
  agent_full_name: string;
  is_primary: boolean;
  commission_override_type: "percentage" | "fixed" | null;
  commission_override_value: string | null;
  assigned_at: string;
}

export interface PropertyAgentCommissionOverrideRequest {
  commission_type: "percentage" | "fixed";
  commission_value: number;
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
  latitude: number | null;
  longitude: number | null;
  build_year: number | null;
  amenities: string[] | null;
  tags: string[] | null;
  internal_reference: string | null;
  status: PropertyStatus;
  // Extended attributes
  furnishing_status: FurnishingStatus | null;
  completion_status: CompletionStatus | null;
  ownership_type: OwnershipType | null;
  view_orientation: ViewOrientation | null;
  service_charge_aed_sqft: string | null;
  rera_permit_number: string | null;
  plot_area_sqft: number | null;
  parking_spaces: number | null;
  floor_level: FloorLevel | null;
  fit_out_status: FitOutStatus | null;
  ceiling_height_m: string | null;
  handover_year: number | null;
  handover_quarter: number | null;
  payment_plan: boolean | null;
  assigned_agents: PropertyAgentAssignment[];
  media_count: number;
  listing_count: number;
  thumbnail_url?: string | null;
  thumbnail_kind?: "image" | "video" | null;
  first_active_listing_id?: string | null;
  first_active_listing_title?: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  build_year?: number | null;
  internal_reference?: string | null;
  tags?: string[] | null;
  amenities?: string[] | null;
  agent_ids?: string[] | null;
  furnishing_status?: FurnishingStatus | null;
  completion_status?: CompletionStatus | null;
  ownership_type?: OwnershipType | null;
  view_orientation?: ViewOrientation | null;
  service_charge_aed_sqft?: string | null;
  rera_permit_number?: string | null;
  plot_area_sqft?: number | null;
  parking_spaces?: number | null;
  floor_level?: FloorLevel | null;
  fit_out_status?: FitOutStatus | null;
  ceiling_height_m?: string | null;
  handover_year?: number | null;
  handover_quarter?: number | null;
  payment_plan?: boolean | null;
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
  latitude?: number | null;
  longitude?: number | null;
  build_year?: number | null;
  status?: PropertyStatus | null;
  internal_reference?: string | null;
  tags?: string[] | null;
  amenities?: string[] | null;
  furnishing_status?: FurnishingStatus | null;
  completion_status?: CompletionStatus | null;
  ownership_type?: OwnershipType | null;
  view_orientation?: ViewOrientation | null;
  service_charge_aed_sqft?: string | null;
  rera_permit_number?: string | null;
  plot_area_sqft?: number | null;
  parking_spaces?: number | null;
  floor_level?: FloorLevel | null;
  fit_out_status?: FitOutStatus | null;
  ceiling_height_m?: string | null;
  handover_year?: number | null;
  handover_quarter?: number | null;
  payment_plan?: boolean | null;
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
  min_build_year?: number;
  max_build_year?: number;
  listing_verified?: boolean;
  has_floor_plan?: boolean;
  q?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  skip?: number;
  limit?: number;
  // New filter params
  amenities?: string;
  furnishing_status?: FurnishingStatus;
  completion_status?: CompletionStatus;
  ownership_type?: OwnershipType;
  view_orientation?: ViewOrientation;
  fit_out_status?: FitOutStatus;
  min_service_charge_aed_sqft?: string;
  max_service_charge_aed_sqft?: string;
  min_plot_area_sqft?: number;
  max_plot_area_sqft?: number;
  min_parking_spaces?: number;
  has_payment_plan?: boolean;
  handover_year?: number;
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
