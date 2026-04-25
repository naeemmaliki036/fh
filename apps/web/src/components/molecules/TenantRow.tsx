import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/lib/types";

interface TenantRowProps {
  tenant: Tenant;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
}

export function TenantRow({ tenant, onApprove, onSuspend }: TenantRowProps): React.ReactElement {
  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium">{tenant.name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{tenant.slug}</td>
      <td className="px-4 py-3">
        <StatusBadge status={tenant.status} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{tenant.currency}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {tenant.status === "pending_approval" && (
            <Button size="sm" onClick={() => onApprove(tenant.id)}>
              Approve
            </Button>
          )}
          {tenant.status === "active" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onSuspend(tenant.id)}
            >
              Suspend
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
