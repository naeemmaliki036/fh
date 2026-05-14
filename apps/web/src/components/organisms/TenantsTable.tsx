"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";
import { useAdminTenants } from "@/hooks/queries/useTenantAdmin";
import { TenantStatusBadge } from "@/components/atoms/TenantStatusBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils/format-date";
import type { Tenant, TenantStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: TenantStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

function viewSiteTooltip(tenant: Tenant): string | null {
  if (!tenant.public_site_feature_enabled) return "Public site feature not enabled";
  if (!tenant.public_site_enabled) return "Tenant has disabled their public site";
  if (tenant.public_site_direct_links_only) return "Direct-link only mode";
  return null;
}

function ViewSiteButton({ tenant }: { tenant: Tenant }): React.ReactElement {
  const tooltip = viewSiteTooltip(tenant);
  const isActive = tooltip === null;

  if (isActive) {
    return (
      <a
        href={`/p/${tenant.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Open public site"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  }

  return (
    <button
      disabled
      title={tooltip ?? undefined}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground/40 cursor-not-allowed"
    >
      <ExternalLink className="h-4 w-4" />
    </button>
  );
}

export function TenantsTable(): React.ReactElement {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useAdminTenants({
    status: statusFilter === "all" ? undefined : statusFilter,
    q: search || undefined,
  });

  const tenants = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TenantStatus | "all")}
        >
          <SelectTrigger className="w-48">
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
        <span className="text-sm text-muted-foreground shrink-0">{data?.total ?? 0} tenants</span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading tenants...</p>}
      {error && <p className="text-sm text-destructive">Failed to load tenants.</p>}

      {!isLoading && !error && tenants.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
          <p className="text-sm font-medium">No tenants found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}

      {tenants.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Currency</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium w-10">Site</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/tenants/${tenant.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{tenant.slug}</td>
                  <td className="px-4 py-3">
                    <TenantStatusBadge status={tenant.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{tenant.currency}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(tenant.created_at, "en")}</td>
                  <td className="px-4 py-3">
                    <ViewSiteButton tenant={tenant} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
