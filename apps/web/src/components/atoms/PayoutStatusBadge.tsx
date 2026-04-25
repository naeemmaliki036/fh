import { Badge } from "@/components/ui/badge";
import type { CommissionPayoutStatus } from "@/lib/types/deal";

type Variant = "secondary" | "warning" | "success" | "destructive";

const CONFIG: Record<CommissionPayoutStatus, { label: string; variant: Variant }> = {
  pending:  { label: "Pending",  variant: "secondary" },
  partial:  { label: "Partial",  variant: "warning" },
  paid:     { label: "Paid",     variant: "success" },
  canceled: { label: "Canceled", variant: "destructive" },
};

export function PayoutStatusBadge({ status }: { status: CommissionPayoutStatus }): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
