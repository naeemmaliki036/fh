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

// ---- Customer detail (GET /customers/{id}) ----

export type PendingDocumentStatus = "pending" | "approved" | "rejected";

export interface PendingDocument {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  kind: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: PendingDocumentStatus;
  rejection_reason: string | null;
  uploaded_by_user_id: string | null;
  uploader_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealHistoryItem {
  id: string;
  deal_type: string;
  stage: string;
  transaction_value: string;
  transaction_currency: string;
  closed_at: string | null;
  property_title: string | null;
  property_id: string | null;
}

export interface InterestedListing {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  interest_status: "interested" | "won" | "lost";
  linked_at: string;
  notes: string | null;
  won_customer_name: string | null;
}

export interface CustomerDetail extends Customer {
  documents: PendingDocument[];
  deal_history: DealHistoryItem[];
  interested_listings: InterestedListing[];
  assigned_agent_name: string | null;
}

// ---- Listing interested customers ----

export interface ListingInterestedCustomer {
  id: string;
  listing_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  interest_status: "interested" | "won" | "lost";
  linked_at: string;
  notes: string | null;
}

export interface ListingInterestedCustomersResponse {
  items: ListingInterestedCustomer[];
  total: number;
}

export interface LinkCustomerToListingRequest {
  customer_id: string;
  notes?: string | null;
}

// ---- Pending documents queue ----

export interface PendingDocumentQueueItem {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  kind: string;
  original_filename: string;
  size_bytes: number;
  uploaded_by_user_id: string | null;
  uploader_name: string | null;
  created_at: string;
}

export interface PendingDocumentQueueResponse {
  items: PendingDocumentQueueItem[];
  total: number;
}

export interface PendingDocumentQueueParams {
  entity_type?: string;
  assigned_to_me?: boolean;
  skip?: number;
  limit?: number;
}

export interface RejectDocumentRequest {
  reason: string;
}

// ---- Doc-request reactivate ----

export interface ReactivateDocumentRequestBody {
  expires_in_days: number;
}
