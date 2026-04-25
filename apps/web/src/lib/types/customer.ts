export type CustomerSource =
  | "portal"
  | "website"
  | "manual"
  | "import"
  | "referral"
  | "walk_in"
  | "other";

export type CustomerStatus = "active" | "inactive" | "blacklisted";

export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  nationality: string | null;
  language: string | null;
  preferred_currency: string | null;
  source: CustomerSource;
  status: CustomerStatus;
  notes: string | null;
  assigned_agent_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateRequest {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  language?: string | null;
  preferred_currency?: string | null;
  source?: CustomerSource;
  status?: CustomerStatus;
  notes?: string | null;
  assigned_agent_id?: string | null;
}

export interface CustomerUpdateRequest {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  language?: string | null;
  preferred_currency?: string | null;
  source?: CustomerSource | null;
  notes?: string | null;
  assigned_agent_id?: string | null;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
}

export interface CustomerListParams {
  status?: CustomerStatus;
  assigned_agent_id?: string;
  q?: string;
  skip?: number;
  limit?: number;
}

/** Thrown by CustomerRepository.create() on 409 phone collision. */
export class CustomerConflictError extends Error {
  public readonly existingCustomerId: string;
  constructor(message: string, existingCustomerId: string) {
    super(message);
    this.name = "CustomerConflictError";
    this.existingCustomerId = existingCustomerId;
  }
}
