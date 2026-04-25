import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/lib/types/listing";

type Variant = "success" | "warning" | "secondary" | "destructive" | "outline";

const CONFIG: Record<ListingStatus, { label: string; variant: Variant }> = {
  draft:    { label: "Draft",    variant: "secondary" },
  active:   { label: "Active",   variant: "success" },
  paused:   { label: "Paused",   variant: "warning" },
  expired:  { label: "Expired",  variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
