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

const ACTION_LABELS: Record<AuditAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  status_changed: "Status changed",
  price_changed: "Price changed",
  document_accessed: "Document accessed",
  document_uploaded: "Document uploaded",
  document_deleted: "Document deleted",
  commission_overridden: "Commission overridden",
  hero_media_set: "Hero media set",
  other: "Other",
};

const ALL_ACTIONS: AuditAction[] = Object.keys(ACTION_LABELS) as AuditAction[];

function avatarInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function DiffBlock({ diff }: { diff: Record<string, unknown> | null }): ReactElement {
  const [expanded, setExpanded] = useState(false);
  if (!diff || Object.keys(diff).length === 0) return <></>;

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
          {JSON.stringify(diff, null, 2)}
        </pre>
      )}
    </div>
  );
}

function TimelineRow({ entry }: { entry: AuditLog }): ReactElement {
  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      {/* Avatar */}
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
        {entry.actor_name ? avatarInitials(entry.actor_name) : <User className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs py-0">
            {ACTION_LABELS[entry.action] ?? entry.action}
          </Badge>
          {entry.actor_name && (
            <span className="text-xs text-muted-foreground">{entry.actor_name}</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDate(entry.created_at, "en")}
          </span>
        </div>

        {entry.reason_note && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">"{entry.reason_note}"</p>
        )}

        <DiffBlock diff={entry.diff} />
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

  // TODO: Backend needs GET /audit-logs?entity_type=&entity_id= endpoint
  // Currently stubbed — the query will fail gracefully if endpoint is missing
  const { data, isLoading, error } = useAuditLog(entityType, entityId);

  const entries = (data?.items ?? [])
    .filter((e) => actionFilter === "all" || e.action === actionFilter)
    .slice()
    .reverse();

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
            {ALL_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>{ACTION_LABELS[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading activity...</p>}

      {error && (
        <p className="text-sm text-muted-foreground italic">
          {/* TODO: audit-log list endpoint not yet implemented on backend */}
          Activity log not available yet.
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
