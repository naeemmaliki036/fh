"use client";

import { useState, type ReactElement } from "react";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLog } from "@/hooks/queries/useAuditLog";
import { formatDate } from "@/lib/utils/format-date";
import type { AuditLog, AuditAction } from "@/lib/types/audit-log";

const ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  tenant_created: "Tenant created",
  tenant_approved: "Tenant approved",
  tenant_rejected: "Tenant rejected",
  tenant_suspended: "Tenant suspended",
  tenant_reactivated: "Tenant reactivated",
  user_created: "User created",
  user_role_changed: "Role changed",
  user_status_changed: "User status changed",
  user_deactivated: "User deactivated",
  user_reactivated: "User reactivated",
  agent_created: "Agent created",
  agent_status_changed: "Agent status changed",
  property_created: "Property created",
  property_updated: "Property updated",
  property_status_changed: "Status changed",
  property_tags_changed: "Tags changed",
  listing_created: "Listing created",
  listing_status_changed: "Status changed",
  listing_price_changed: "Price changed",
  listing_hero_media_set: "Hero media set",
  listing_document_uploaded: "Document uploaded",
  listing_document_deleted: "Document deleted",
  lead_created: "Lead created",
  deal_created: "Deal created",
  deal_stage_changed: "Stage changed",
  commission_overridden: "Commission overridden",
  document_accessed: "Document accessed",
  document_uploaded: "Document uploaded",
  document_deleted: "Document deleted",
  other: "Other",
};

function labelFor(action: AuditAction): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function avatarInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function DiffBlock({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const hasContent =
    (before && Object.keys(before).length > 0) || (after && Object.keys(after).length > 0);
  if (!hasContent) return <></>;

  return (
    <div className="mt-1.5">
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? "Hide" : "Show"} details
      </button>
      {expanded && (
        <pre className="mt-1 text-xs bg-muted rounded-md p-2 overflow-x-auto max-h-40">
          {JSON.stringify({ before, after }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function TimelineRow({ entry }: { entry: AuditLog }): ReactElement {
  const actorName = entry.actor?.full_name ?? entry.actor?.email ?? null;

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {actorName ? avatarInitials(actorName) : <User className="h-4 w-4 text-muted-foreground" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs py-0">
            {labelFor(entry.action)}
          </Badge>
          {actorName && (
            <span className="text-xs text-muted-foreground">{actorName}</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDate(entry.created_at, "en")}
          </span>
        </div>

        <DiffBlock before={entry.metadata_before} after={entry.metadata_after} />
      </div>
    </div>
  );
}

interface AuditTimelinePanelProps {
  entityType: string;
  entityId: string;
}

export function AuditTimelinePanel({ entityType, entityId }: AuditTimelinePanelProps): ReactElement {
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const { data, isLoading, error } = useAuditLog(entityType, entityId);

  const entries = (data?.items ?? []).filter(
    (e) => actionFilter === "all" || e.action === actionFilter,
  );

  const knownActions = Array.from(new Set((data?.items ?? []).map((e) => e.action)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-muted-foreground">Activity log</p>
        <Select
          value={actionFilter}
          onValueChange={(v) => setActionFilter(v as AuditAction | "all")}
        >
          <SelectTrigger className="h-8 w-48 text-xs ml-auto">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {knownActions.map((a) => (
              <SelectItem key={a} value={a}>{labelFor(a)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading activity...</p>}

      {error && (
        <p className="text-sm text-muted-foreground italic">
          Activity log unavailable right now.
        </p>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="py-8 border rounded-md bg-muted/20 text-center text-muted-foreground">
          <p className="text-sm">No activity recorded yet.</p>
        </div>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="rounded-md border px-4 divide-y divide-border">
          {entries.map((e) => <TimelineRow key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  );
}
