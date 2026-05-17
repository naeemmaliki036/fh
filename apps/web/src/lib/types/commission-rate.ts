export type TransactionType = "sale" | "rent_long" | "rent_short" | "off_plan";

export interface TenantCommissionRate {
  id: string;
  tenant_id: string;
  transaction_type: TransactionType;
  rate: number; // decimal e.g. 0.02 = 2%
  notes: string | null;
  updated_by_user_id: string | null;
  updated_by_user_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionRateListResponse {
  items: TenantCommissionRate[];
}

export interface CommissionRateUpdateRequest {
  rate: number; // decimal e.g. 0.02 = 2%
  notes?: string | null;
}

export interface CommissionRateAuditEntry {
  id: string;
  action: string;
  actor_user_id: string | null;
  actor_user_email: string | null;
  before_value: number | null;
  after_value: number | null;
  occurred_at: string;
}

/** Fallback defaults mirroring migration seeds (decimal form). */
export const COMMISSION_RATE_DEFAULTS: Record<TransactionType, number> = {
  sale: 0.02,
  rent_long: 0.05,
  rent_short: 0.10,
  off_plan: 0.03,
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: "Sale",
  rent_long: "Long-term Rent",
  rent_short: "Short-term Rent",
  off_plan: "Off-plan",
};
