import type { DealStage, DealType } from "@/lib/types/deal";

export const STAGE_LABELS: Record<DealStage, string> = {
  initiated: "Initiated",
  documents_pending: "Docs Pending",
  deposit_pending: "Deposit Pending",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  canceled: "Canceled",
};

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  sale: "Sale",
  rent_short: "Short-term Rent",
  rent_long: "Long-term Rent",
};
