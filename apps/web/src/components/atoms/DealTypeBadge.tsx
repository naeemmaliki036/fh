import { Badge } from "@/components/ui/badge";
import type { DealType } from "@/lib/types/deal";

const CONFIG: Record<DealType, { label: string; className: string }> = {
  sale:       { label: "Sale",       className: "bg-blue-100 text-blue-800 border-blue-200" },
  rent_long:  { label: "Long Rent",  className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  rent_short: { label: "Short Rent", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

export function DealTypeBadge({ type }: { type: DealType }): React.ReactElement {
  const { label, className } = CONFIG[type] ?? { label: type, className: "" };
  return <Badge variant="outline" className={className}>{label}</Badge>;
}
