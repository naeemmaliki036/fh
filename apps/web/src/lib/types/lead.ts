import type { CustomerSource } from "./customer";

export type LeadStage = "new" | "contacted" | "qualified" | "viewing" | "offer" | "won" | "lost";

export interface CustomerSummary {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
}

export interface PropertySummary {
  id: string;
  title: string;
  status: string;
}

export interface ListingSummary {
  id: string;
  purpose: string;
  price: string;
  currency: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  customer_id: string;
  source: CustomerSource;
  stage: LeadStage;
  assigned_agent_id: string | null;
  assigned_at: string | null;
  interest_property_id: string | null;
  interest_listing_id: string | null;
  notes: string | null;
  next_action_at: string | null;
  closed_at: string | null;
  created_by_user_id: string | null;
  customer: CustomerSummary | null;
  interest_property: PropertySummary | null;
  interest_listing: ListingSummary | null;
  created_at: string;
  updated_at: string;
}

export interface InlineCustomerCreate {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  language?: string | null;
  source?: CustomerSource | null;
}

export interface LeadCreateRequest {
  source: CustomerSource;
  customer_id?: string | null;
  customer?: InlineCustomerCreate | null;
  stage?: LeadStage;
  assigned_agent_id?: string | null;
  interest_property_id?: string | null;
  interest_listing_id?: string | null;
  notes?: string | null;
  next_action_at?: string | null;
}

export interface LeadUpdateRequest {
  notes?: string | null;
  interest_property_id?: string | null;
  interest_listing_id?: string | null;
  next_action_at?: string | null;
}

export interface LeadTransitionRequest {
  stage: LeadStage;
  description?: string | null;
}

export interface LeadAssignRequest {
  agent_id: string | null;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
}

export interface LeadListParams {
  stage?: LeadStage;
  assigned_agent_id?: string;
  customer_id?: string;
  q?: string;
  skip?: number;
  limit?: number;
}

/** Legal next stages from each stage (client-side mirror of server state machine). */
export const STAGE_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  new: ["contacted", "lost"],
  contacted: ["qualified", "lost"],
  qualified: ["viewing", "lost"],
  viewing: ["offer", "qualified", "lost"],
  offer: ["won", "lost", "viewing"],
  won: [],
  lost: [],
};

export const TERMINAL_STAGES = new Set<LeadStage>(["won", "lost"]);

/** Thrown by LeadRepository.create() on 409 phone collision. */
export class LeadConflictError extends Error {
  public readonly existingCustomerId: string;
  constructor(message: string, existingCustomerId: string) {
    super(message);
    this.name = "LeadConflictError";
    this.existingCustomerId = existingCustomerId;
  }
}
