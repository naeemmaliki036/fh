"use client";

import { useState } from "react";
import { useTenants } from "@/hooks/queries/useTenants";
import { useApproveTenant, useSuspendTenant } from "@/hooks/mutations/useTenantMutations";
import { TenantRow } from "@/components/molecules/TenantRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TenantStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: TenantStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export function TenantsTable(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const { data, isLoading, error } = useTenants(
    statusFilter === "all" ? undefined : statusFilter,
  );
  const { mutate: approve } = useApproveTenant();
  const { mutate: suspend } = useSuspendTenant();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading tenants...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load tenants.</p>;

  const tenants = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TenantStatus | "all")}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{tenants.length} tenants</span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Currency</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                onApprove={approve}
                onSuspend={suspend}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
