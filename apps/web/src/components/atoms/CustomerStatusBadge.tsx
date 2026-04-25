import { Badge } from "@/components/ui/badge";
import type { CustomerStatus } from "@/lib/types";

const CONFIG: Record<CustomerStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  blacklisted: { label: "Blacklisted", variant: "destructive" },
};

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={variant}>{label}</Badge>;
}
