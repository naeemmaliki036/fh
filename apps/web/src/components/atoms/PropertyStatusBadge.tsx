import { Badge } from "@/components/ui/badge";
import type { PropertyStatus } from "@/lib/types/property";

type Variant = "success" | "warning" | "secondary" | "destructive" | "outline" | "default";

const CONFIG: Record<PropertyStatus, { label: string; variant: Variant }> = {
  draft:      { label: "Draft",      variant: "secondary" },
  available:  { label: "Available",  variant: "success" },
  reserved:   { label: "Reserved",   variant: "warning" },
  sold:       { label: "Sold",       variant: "default" },
  rented:     { label: "Rented",     variant: "default" },
  off_market: { label: "Off Market", variant: "outline" },
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
