"use client";

import { Activity } from "lucide-react";
import { useAuditLog } from "@/hooks/queries/useAuditLog";
import { formatDate } from "@/lib/utils/format-date";
import type { AuditAction } from "@/lib/types/audit-log";

const ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  property_created: "created a property",
  property_updated: "updated a property",
  property_status_changed: "changed property status",
  property_tags_changed: "updated tags",
  listing_created: "created a listing",
  listing_status_changed: "changed listing status",
  listing_price_changed: "changed listing price",
  listing_hero_media_set: "set hero media",
  listing_document_uploaded: "uploaded a document",
  listing_document_deleted: "deleted a document",
  lead_created: "created a lead",
  deal_created: "created a deal",
  deal_stage_changed: "moved a deal stage",
  commission_overridden: "overrode commission",
  agent_created: "added an agent",
  agent_status_changed: "changed agent status",
  user_created: "added a user",
  user_role_changed: "changed a user's role",
  document_accessed: "accessed a document",
  document_uploaded: "uploaded a document",
  document_deleted: "deleted a document",
};

function verbFor(action: AuditAction): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export function DashboardRecentActivity(): React.ReactElement {
  const { data, isLoading } = useAuditLog(undefined, undefined, 10);
  const items = data?.items ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
        <Activity className="h-4 w-4 text-slate-300" />
      </div>

      <div className="px-5">
        {isLoading && (
          <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="py-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-slate-200" />
            <p className="mt-2 text-sm font-medium text-slate-400">No activity yet</p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {items.map((entry) => {
              const actorName = entry.actor?.full_name ?? entry.actor?.email ?? "Someone";
              return (
                <li key={entry.id} className="flex items-start gap-2 py-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 truncate">
                      <span className="font-medium">{actorName}</span>{" "}
                      <span className="text-slate-500">{verbFor(entry.action)}</span>
                    </p>
                  </div>
                  <span className="text-slate-400 whitespace-nowrap">
                    {formatDate(entry.created_at, "en")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
