"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronRight } from "lucide-react";
import { useAuditLog } from "@/hooks/queries/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AuditAction, AuditLog } from "@/lib/types/audit-log";

const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);
const PAGE_SIZE = 50;

const ENTITY_TYPES: { value: string; label: string }[] = [
  { value: "tenant", label: "Tenant" },
  { value: "user", label: "User" },
  { value: "agent", label: "Agent" },
  { value: "property", label: "Property" },
  { value: "listing", label: "Listing" },
  { value: "deal", label: "Deal" },
  { value: "lead", label: "Lead" },
  { value: "customer", label: "Customer" },
  { value: "document_request", label: "Document Request" },
  { value: "private_document", label: "Private Document" },
  { value: "tenant_commission_rate", label: "Commission Rate" },
];

// Curated subset of the AuditAction union — full list is huge; show common ones.
const COMMON_ACTIONS: AuditAction[] = [
  "property_created", "property_updated", "property_status_changed",
  "listing_created", "listing_status_changed", "listing_price_changed",
  "lead_created", "deal_created", "deal_stage_changed",
  "commission_overridden",
  "user_role_changed", "user_status_changed",
  "document_uploaded", "document_accessed", "document_deleted",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-AE", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function actorLabel(log: AuditLog): string {
  if (log.actor?.email) return log.actor.email;
  if (log.actor?.full_name) return log.actor.full_name;
  if (log.actor_platform_user_id) return "Platform admin";
  return "System";
}

function ExpandableRow({ log }: { log: AuditLog }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const hasDetails = log.metadata_before || log.metadata_after;
  return (
    <>
      <tr className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => hasDetails && setOpen((v) => !v)}>
        <td className="px-3 py-2.5 align-top">
          {hasDetails ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : null}
        </td>
        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{fmtDate(log.created_at)}</td>
        <td className="px-3 py-2.5">{actorLabel(log)}</td>
        <td className="px-3 py-2.5"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.action}</code></td>
        <td className="px-3 py-2.5 text-muted-foreground">{log.entity_type ?? "—"}</td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{log.entity_id?.slice(0, 8) ?? "—"}</td>
      </tr>
      {open && hasDetails && (
        <tr className="bg-muted/20">
          <td colSpan={6} className="px-3 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-muted-foreground mb-1">Before</p>
                <pre className="bg-background border rounded p-2 overflow-x-auto">{JSON.stringify(log.metadata_before ?? null, null, 2)}</pre>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground mb-1">After</p>
                <pre className="bg-background border rounded p-2 overflow-x-auto">{JSON.stringify(log.metadata_after ?? null, null, 2)}</pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLogPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [page, setPage] = useState(1);

  const offset = (page - 1) * PAGE_SIZE;
  const { data, isLoading, isError } = useAuditLog(
    entityType || undefined,
    undefined,
    PAGE_SIZE,
    {
      offset,
      ...(action ? { action: action as AuditAction } : {}),
    },
  );

  if (!currentUser || !ADMIN_ROLES.has(currentUser.role)) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Audit log access is restricted to company owners and admins.
      </CardContent></Card>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtersActive = !!entityType || !!action;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <History className="h-6 w-6" /> Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every action that affects your data — who changed what, and when. Read-only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Narrow the timeline. Resets pagination.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Entity type</Label>
              <Select value={entityType || "__all__"} onValueChange={(v) => { setEntityType(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All entities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All entities</SelectItem>
                  {ENTITY_TYPES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={action || "__all__"} onValueChange={(v) => { setAction(v === "__all__" ? "" : v); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All actions</SelectItem>
                  {COMMON_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              {filtersActive && (
                <Button variant="outline" size="sm" onClick={() => { setEntityType(""); setAction(""); setPage(1); }}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
          {isError && <p className="py-12 text-center text-sm text-destructive">Failed to load audit log.</p>}
          {!isLoading && !isError && items.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No audit entries match the current filters.
            </p>
          )}
          {!isLoading && !isError && items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr className="text-left">
                  <th className="px-3 py-2 w-6"></th>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => <ExpandableRow key={log.id} log={log} />)}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {offset + 1} – {Math.min(offset + items.length, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
