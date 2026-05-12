export type ReasonOption = { value: string; label: string };

export const AGENT_INACTIVE_REASONS: ReasonOption[] = [
  { value: "left_company", label: "Left company" },
  { value: "performance", label: "Performance" },
  { value: "license_expired", label: "License expired" },
  { value: "other", label: "Other" },
];

export const AGENT_ACTIVE_REASONS: ReasonOption[] = [
  { value: "returned_to_role", label: "Returned to role" },
  { value: "compliance_updated", label: "Compliance updated" },
  { value: "rehired", label: "Re-hired" },
  { value: "other", label: "Other" },
];

export const AGENT_ON_LEAVE_REASONS: ReasonOption[] = [
  { value: "personal_leave", label: "Personal leave" },
  { value: "medical", label: "Medical" },
  { value: "maternity_paternity", label: "Maternity/Paternity" },
  { value: "other", label: "Other" },
];

export const USER_DISABLED_REASONS: ReasonOption[] = [
  { value: "left_company", label: "Left company" },
  { value: "security_concern", label: "Security concern" },
  { value: "inactive", label: "Inactive" },
  { value: "other", label: "Other" },
];

export const USER_ACTIVE_REASONS: ReasonOption[] = [
  { value: "returned_to_role", label: "Returned to role" },
  { value: "compliance_cleared", label: "Compliance cleared" },
  { value: "other", label: "Other" },
];

export const LISTING_PAUSED_REASONS: ReasonOption[] = [
  { value: "awaiting_documents", label: "Awaiting documents" },
  { value: "price_under_review", label: "Price under review" },
  { value: "owner_request", label: "Owner request" },
  { value: "other", label: "Other" },
];

export const LISTING_ACTIVE_REASONS: ReasonOption[] = [
  { value: "documents_received", label: "Documents received" },
  { value: "price_approved", label: "Price approved" },
  { value: "owner_request", label: "Owner request" },
  { value: "other", label: "Other" },
];

export const LISTING_ARCHIVED_REASONS: ReasonOption[] = [
  { value: "sold_elsewhere", label: "Sold elsewhere" },
  { value: "withdrawn_by_owner", label: "Withdrawn by owner" },
  { value: "expired", label: "Expired" },
  { value: "other", label: "Other" },
];

export const LISTING_UNARCHIVE_REASONS: ReasonOption[] = [
  { value: "relisting", label: "Re-listing" },
  { value: "other", label: "Other" },
];

export const PROPERTY_OFF_MARKET_REASONS: ReasonOption[] = [
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "withdrawn_by_owner", label: "Withdrawn by owner" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export const PROPERTY_AVAILABLE_REASONS: ReasonOption[] = [
  { value: "back_on_market", label: "Back on market" },
  { value: "price_update", label: "Price update" },
  { value: "other", label: "Other" },
];
