import { Badge } from "@/components/ui/badge";
import type { PlatformRole } from "@/lib/types";

interface PlatformUserRoleBadgeProps {
  role: PlatformRole;
}

const LABELS: Record<PlatformRole, string> = {
  super_admin: "Super Admin",
  operations_admin: "Operations Admin",
  finance_admin: "Finance Admin",
  support_admin: "Support Admin",
};

export function PlatformUserRoleBadge({ role }: PlatformUserRoleBadgeProps): React.ReactElement {
  const label = LABELS[role] ?? role;
  const variant = role === "super_admin" ? "default" : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}
