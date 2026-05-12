import { Badge } from "@/components/ui/badge";
import { formatCommission } from "@/lib/utils/format-commission";
import type { CommissionType } from "@/lib/types";

interface CommissionBadgeProps {
  type: CommissionType;
  value: string;
  currency?: string;
}

export function CommissionBadge({ type, value, currency }: CommissionBadgeProps): React.ReactElement {
  return <Badge variant="outline">{formatCommission(value, type, currency)}</Badge>;
}
