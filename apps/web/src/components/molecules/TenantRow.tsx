import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
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
            <ConfirmDialog
              trigger={<Button size="sm">Approve</Button>}
              title={`Approve ${tenant.name}?`}
              description={`This will activate the tenant account "${tenant.name}" (slug: ${tenant.slug}). The owner and all users on this tenant will be able to log in immediately.`}
              confirmLabel="Approve tenant"
              onConfirm={() => onApprove(tenant.id)}
            />
          )}
          {tenant.status === "active" && (
            <ConfirmDialog
              trigger={
                <Button size="sm" variant="destructive">
                  Suspend
                </Button>
              }
              title={`Suspend ${tenant.name}?`}
              description={`This will block all users on "${tenant.name}" from logging in. Existing sessions remain valid until they expire. You can reactivate later.`}
              confirmLabel="Suspend tenant"
              variant="destructive"
              onConfirm={() => onSuspend(tenant.id)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
