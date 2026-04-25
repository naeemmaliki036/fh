"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useLeadActivities } from "@/hooks/queries/useLeads";
import { useAddLeadActivity, useDeleteLeadActivity } from "@/hooks/mutations/useLeadMutations";
import { LeadActivityKindIcon } from "@/components/atoms/LeadActivityKindIcon";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { MANUAL_ACTIVITY_KINDS } from "@/lib/types/lead-activity";
import type { LeadActivityKind } from "@/lib/types/lead-activity";

const KIND_VALUES = MANUAL_ACTIVITY_KINDS as [LeadActivityKind, ...LeadActivityKind[]];
const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const KIND_LABELS: Record<LeadActivityKind, string> = {
  note: "Note", stage_changed: "Stage changed", assignment_changed: "Assignment changed",
  contact_made: "Contact made", viewing_scheduled: "Viewing scheduled",
  viewing_completed: "Viewing completed", offer_made: "Offer made",
  offer_accepted: "Offer accepted", offer_rejected: "Offer rejected", other: "Other",
};

interface LeadActivityTimelineProps {
  leadId: string;
}

export function LeadActivityTimeline({ leadId }: LeadActivityTimelineProps): React.ReactElement {
  const [kind, setKind] = useState<LeadActivityKind>("note");
  const [description, setDescription] = useState("");
  const { currentUser } = useAuth();

  const { data: activities, isLoading } = useLeadActivities(leadId);
  const { mutate: add, isPending: adding } = useAddLeadActivity(leadId);
  const { mutate: remove, isPending: removing } = useDeleteLeadActivity(leadId);

  const canManage = !!(currentUser && ADMIN_ROLES.has(currentUser.role));

  const handleAdd = (): void => {
    if (!description.trim()) return;
    add({ kind, description }, {
      onSuccess: () => setDescription(""),
    });
  };

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-md border p-4 space-y-3 bg-muted/20">
        <p className="text-sm font-medium">Add Activity</p>
        <div className="flex gap-2 items-start">
          <Select value={kind} onValueChange={v => setKind(v as LeadActivityKind)}>
            <SelectTrigger className="w-44 flex-shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {KIND_VALUES.map(k => <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Add a note or record an activity…"
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
          <Button onClick={handleAdd} disabled={adding || !description.trim()} size="sm" className="flex-shrink-0">
            {adding ? "…" : "Add"}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="space-y-2">
        {(activities ?? []).map(a => (
          <div key={a.id} className="flex gap-3 p-3 rounded-md border bg-card">
            <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
              <LeadActivityKindIcon kind={a.kind} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{KIND_LABELS[a.kind]}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{relTime(a.created_at)}</span>
              </div>
              {a.description && <p className="text-sm mt-0.5">{a.description}</p>}
              {a.actor_full_name && (
                <p className="text-xs text-muted-foreground mt-0.5">by {a.actor_full_name}</p>
              )}
            </div>
            {canManage && a.kind === "note" && (
              <Button
                size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0"
                onClick={() => remove(a.id)} disabled={removing}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {!isLoading && (activities ?? []).length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
        )}
      </div>
    </div>
  );
}
