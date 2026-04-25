import { Badge } from "@/components/ui/badge";
import type { TenantStatus, UserStatus, AgentStatus } from "@/lib/types";

type Status = TenantStatus | UserStatus | AgentStatus;
type Variant = "success" | "warning" | "destructive" | "secondary";

const STATUS_CONFIG: Partial<Record<Status, { label: string; variant: Variant }>> = {
  active: { label: "Active", variant: "success" },
  pending_approval: { label: "Pending Approval", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
  disabled: { label: "Disabled", variant: "secondary" },
  inactive: { label: "Inactive", variant: "secondary" },
  on_leave: { label: "On Leave", variant: "warning" },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
