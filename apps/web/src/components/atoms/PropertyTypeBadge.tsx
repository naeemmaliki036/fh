import { Badge } from "@/components/ui/badge";
import type { PropertyType } from "@/lib/types/property";

const LABELS: Record<PropertyType, string> = {
  apartment: "Apartment", villa: "Villa", townhouse: "Townhouse",
  penthouse: "Penthouse", office: "Office", retail: "Retail",
  warehouse: "Warehouse", plot: "Plot", building: "Building", other: "Other",
};

export function PropertyTypeBadge({ type }: { type: PropertyType }): React.ReactElement {
  return <Badge variant="secondary">{LABELS[type] ?? type}</Badge>;
}
