export type PriceValidationPurpose = "sale" | "rent_long" | "rent_short";

export interface PriceValidationRule {
  id: string;
  country: string | null;
  city: string | null;
  purpose: PriceValidationPurpose | null;
  currency: string;
  min_amount: string | null;
  max_amount: string | null;
  notes: string | null;
  enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PriceValidationRuleListResponse {
  items: PriceValidationRule[];
  total: number;
}

export interface PriceValidationRuleCreateRequest {
  country?: string | null;
  city?: string | null;
  purpose?: PriceValidationPurpose | null;
  currency?: string;
  min_amount?: string | null;
  max_amount?: string | null;
  notes?: string | null;
  enabled?: boolean;
  display_order?: number | null;
}

export interface PriceValidationRuleUpdateRequest {
  country?: string | null;
  city?: string | null;
  purpose?: PriceValidationPurpose | null;
  currency?: string;
  min_amount?: string | null;
  max_amount?: string | null;
  notes?: string | null;
  enabled?: boolean;
  display_order?: number | null;
}

export interface PriceValidationPreviewSource {
  rule_id: string;
  country: string | null;
  city: string | null;
  purpose: PriceValidationPurpose | null;
  currency: string;
  min_amount: string | null;
  max_amount: string | null;
}

export interface PriceValidationPreviewResponse {
  effective_min_amount: string | null;
  effective_max_amount: string | null;
  currency: string;
  sources: PriceValidationPreviewSource[];
}

export interface PriceValidationPreviewParams {
  country?: string;
  city?: string;
  purpose?: PriceValidationPurpose;
  currency?: string;
}
