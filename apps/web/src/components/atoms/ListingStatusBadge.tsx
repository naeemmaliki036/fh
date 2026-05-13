import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/lib/types/listing";

type Variant = "success" | "warning" | "secondary" | "destructive" | "outline" | "default" | "info";

const CONFIG: Record<ListingStatus, { label: string; variant: Variant }> = {
  draft:             { label: "Draft",             variant: "secondary" },
  active:            { label: "Active",            variant: "success" },
  paused:            { label: "Paused",            variant: "warning" },
  sold:              { label: "Sold",              variant: "default" },
  rented:            { label: "Rented",            variant: "default" },
  expired:           { label: "Expired",           variant: "destructive" },
  archived:          { label: "Archived",          variant: "outline" },
  off_market:        { label: "Off Market",        variant: "outline" },
  pending_review:    { label: "Pending Review",    variant: "info" },
  changes_requested: { label: "Changes Requested", variant: "warning" },
  approved:          { label: "Approved",          variant: "success" },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
