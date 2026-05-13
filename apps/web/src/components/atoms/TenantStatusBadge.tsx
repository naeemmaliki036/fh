import { Badge } from "@/components/ui/badge";
import type { TenantStatus } from "@/lib/types";

interface TenantStatusBadgeProps {
  status: TenantStatus;
}

const CONFIG: Record<TenantStatus, { label: string; variant: "warning" | "success" | "destructive" }> = {
  pending_approval: { label: "Pending Approval", variant: "warning" },
  active: { label: "Active", variant: "success" },
  suspended: { label: "Suspended", variant: "destructive" },
};

export function TenantStatusBadge({ status }: TenantStatusBadgeProps): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={variant}>{label}</Badge>;
}
