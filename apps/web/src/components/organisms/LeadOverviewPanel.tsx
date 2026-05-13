"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadStageBadge } from "@/components/atoms/LeadStageBadge";
import { StageTransitionMenu } from "@/components/molecules/StageTransitionMenu";
import { useAssignLead, useUpdateLead } from "@/hooks/mutations/useLeadMutations";
import { useAgents } from "@/hooks/queries/useAgents";
import { useProperties } from "@/hooks/queries/useProperties";
import { useState } from "react";
import type { Lead } from "@/lib/types/lead";

interface LeadOverviewPanelProps {
  lead: Lead;
}

function minDateTimeLocal(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function LeadOverviewPanel({ lead }: LeadOverviewPanelProps): React.ReactElement {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [nextAction, setNextAction] = useState(lead.next_action_at?.slice(0, 16) ?? "");
  const [nextActionError, setNextActionError] = useState<string | null>(null);
  const minDt = minDateTimeLocal();

  const { data: agentsData } = useAgents();
  const { data: propertiesData } = useProperties();
  const { mutate: assign } = useAssignLead(lead.id);
  const { mutate: update, isPending } = useUpdateLead(lead.id);

  const agents = agentsData?.items ?? [];
  const properties = propertiesData?.items ?? [];

  const handleSave = (): void => {
    if (nextAction && new Date(nextAction).getTime() < Date.now() - 60_000) {
      setNextActionError("Next action must be in the future");
      return;
    }
    setNextActionError(null);
    update({ notes: notes || null, next_action_at: nextAction || null });
  };

  return (
    <div className="space-y-5">
      {/* Customer card */}
      <div className="rounded-md border p-4 space-y-1.5 bg-muted/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
        <p className="font-semibold">{lead.customer?.full_name ?? "—"}</p>
        {lead.customer?.phone && <p className="text-sm text-muted-foreground">{lead.customer.phone}</p>}
        {lead.customer?.email && <p className="text-sm text-muted-foreground">{lead.customer.email}</p>}
        {lead.customer_id && (
          <Link href={`/customers/${lead.customer_id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            View customer <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Stage */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Stage</Label>
          <LeadStageBadge stage={lead.stage} />
        </div>
        <StageTransitionMenu leadId={lead.id} currentStage={lead.stage} />
      </div>

      {/* Agent */}
      <div className="space-y-1.5">
        <Label>Assigned Agent</Label>
        <Select
          value={lead.assigned_agent_id ?? "none"}
          onValueChange={v => assign({ agent_id: v === "none" ? null : v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Interest property */}
      <div className="space-y-1.5">
        <Label>Interest Property</Label>
        <Select
          value={lead.interest_property_id ?? "none"}
          onValueChange={v => update({ interest_property_id: v === "none" ? null : v })}
        >
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {lead.interest_property && (
          <p className="text-xs text-muted-foreground">{lead.interest_property.status}</p>
        )}
      </div>

      {/* Next action */}
      <div className="space-y-1.5">
        <Label>Next Action</Label>
        <Input type="datetime-local" min={minDt} value={nextAction} onChange={e => { setNextAction(e.target.value); setNextActionError(null); }} />
        {nextActionError && <p className="text-xs text-destructive">{nextActionError}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
