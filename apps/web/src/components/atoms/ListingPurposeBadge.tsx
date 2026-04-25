import { Badge } from "@/components/ui/badge";
import type { ListingPurpose } from "@/lib/types/listing";

const LABELS: Record<ListingPurpose, string> = {
  sale: "Sale", rent_short: "Short Rent", rent_long: "Long Rent",
};

export function ListingPurposeBadge({ purpose }: { purpose: ListingPurpose }): React.ReactElement {
  return <Badge variant="outline">{LABELS[purpose] ?? purpose}</Badge>;
}
