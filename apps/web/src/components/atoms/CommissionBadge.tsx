import { Badge } from "@/components/ui/badge";
import type { CommissionType } from "@/lib/types";

interface CommissionBadgeProps {
  type: CommissionType;
  value: string;
}

export function CommissionBadge({ type, value }: CommissionBadgeProps): React.ReactElement {
  const label = type === "percentage" ? `${value}%` : `${value} fixed`;
  return <Badge variant="outline">{label}</Badge>;
}
