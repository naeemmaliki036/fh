import type { CommissionType } from "./agent";

export type DealType = "sale" | "rent_short" | "rent_long";
export type DealStage =
  | "initiated" | "documents_pending" | "deposit_pending"
  | "closed_won" | "closed_lost" | "canceled";
export type CommissionPayoutStatus = "pending" | "partial" | "paid" | "canceled";

export interface DealCustomerSummary {
  id: string;
  full_name: string;
  phone: string | null;
  phone_normalized: string | null;
}

export interface DealAgentSummary {
  id: string;
  full_name: string;
  email: string;
}

export interface DealPropertySummary {
  id: string;
  title: string;
  status: string;
}

export interface Deal {
  id: string;
  tenant_id: string;
  deal_type: DealType;
  customer_id: string;
  property_id: string;
  listing_id: string | null;
  primary_agent_id: string;
  secondary_agent_id: string | null;
  lead_id: string | null;
  stage: DealStage;
  transaction_value: string;
  transaction_currency: string;
  expected_close_at: string | null;
  closed_at: string | null;
  notes: string | null;
  commission_type: CommissionType;
  commission_value: string;
  commission_amount: string;
  commission_overridden: boolean;
  commission_override_reason: string | null;
  commission_payout_status: CommissionPayoutStatus;
  commission_paid_amount: string;
  commission_paid_at: string | null;
  primary_commission_pct: number | null;
  secondary_commission_pct: number | null;
  admin_confirmed_at: string | null;
  admin_confirmed_by_user_id: string | null;
  agent_confirmed_at: string | null;
  created_by_user_id: string;
  customer: DealCustomerSummary | null;
  primary_agent: DealAgentSummary | null;
  secondary_agent: DealAgentSummary | null;
  interest_property: DealPropertySummary | null;
  created_at: string;
  updated_at: string;
}

export interface DealCreateRequest {
  deal_type: DealType;
  customer_id: string;
  property_id: string;
  primary_agent_id: string;
  secondary_agent_id?: string | null;
  primary_commission_pct?: number | null;
  secondary_commission_pct?: number | null;
  transaction_value: string | number;
  transaction_currency: string;
  listing_id?: string | null;
  lead_id?: string | null;
  expected_close_at?: string | null;
  notes?: string | null;
  commission_type?: CommissionType | null;
  commission_value?: string | number | null;
  commission_override_reason?: string | null;
}

export interface DealUpdateRequest {
  notes?: string | null;
  expected_close_at?: string | null;
  listing_id?: string | null;
  transaction_value?: string | number | null;
  transaction_currency?: string | null;
}

export interface DealTransitionRequest {
  stage: DealStage;
  description?: string | null;
}

export interface DealCommissionOverrideRequest {
  commission_type: CommissionType;
  commission_value: string | number;
  override_reason: string;
}

export interface DealCommissionPayoutRequest {
  amount: string | number;
  paid_at?: string | null;
}

export interface DealListResponse {
  items: Deal[];
  total: number;
}

export interface DealListParams {
  stage?: DealStage;
  deal_type?: DealType;
  primary_agent_id?: string;
  customer_id?: string;
  property_id?: string;
  q?: string;
  skip?: number;
  limit?: number;
}

export interface LeaderboardRow {
  agent_id: string;
  agent_name: string;
  deals_won_count: number;
  sold_count: number;
  rented_count: number;
  total_transaction_value: number;
  total_commission_value: number;
  paid_commission: number;
  pending_commission: number;
}

export interface LeaderboardResponse {
  rows: LeaderboardRow[];
  period: string;
}

export type LeaderboardPeriod = "this_month" | "this_quarter" | "this_year" | "custom";

export const DEAL_STAGE_TRANSITIONS: Record<DealStage, DealStage[]> = {
  initiated: ["documents_pending", "canceled", "closed_lost"],
  documents_pending: ["deposit_pending", "initiated", "canceled", "closed_lost"],
  deposit_pending: ["closed_won", "documents_pending", "canceled", "closed_lost"],
  closed_won: [],
  closed_lost: [],
  canceled: [],
};

export const DEAL_TERMINAL_STAGES = new Set<DealStage>(["closed_won", "closed_lost", "canceled"]);
