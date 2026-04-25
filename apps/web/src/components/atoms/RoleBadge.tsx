import { Badge } from "@/components/ui/badge";
import type { TenantRole, PlatformRole } from "@/lib/types";

type AnyRole = TenantRole | PlatformRole | string;

const ROLE_LABELS: Record<string, string> = {
  company_owner: "Company Owner",
  company_admin: "Company Admin",
  property_admin: "Property Admin",
  listing_manager: "Listing Manager",
  agent: "Agent",
  finance_user: "Finance User",
  read_only: "Read Only",
  super_admin: "Super Admin",
  operations_admin: "Operations Admin",
  finance_admin: "Finance Admin",
};

interface RoleBadgeProps {
  role: AnyRole;
}

export function RoleBadge({ role }: RoleBadgeProps): React.ReactElement {
  const label = ROLE_LABELS[role] ?? role;
  return <Badge variant="outline">{label}</Badge>;
}
