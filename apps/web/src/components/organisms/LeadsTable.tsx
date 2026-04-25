"use client";

import { useState } from "react";
import Link from "next/link";
import { useLeads } from "@/hooks/queries/useLeads";
import { useAgents } from "@/hooks/queries/useAgents";
import { LeadStageBadge } from "@/components/atoms/LeadStageBadge";
import { SourceBadge } from "@/components/atoms/SourceBadge";
import { LeadCreateDialog } from "@/components/organisms/LeadCreateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { LeadStage } from "@/lib/types/lead";

const PAGE_SIZE = 20;
const STAGES: LeadStage[] = ["new","contacted","qualified","viewing","offer","won","lost"];

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return `overdue ${Math.abs(diff)}d`;
  if (diff === 0) return "today";
  return `in ${diff}d`;
}

export function LeadsTable(): React.ReactElement {
  const [stage, setStage] = useState<LeadStage | "all">("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [q, setQ] = useState("");
  const [skip, setSkip] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const params = {
    stage: stage === "all" ? undefined : stage,
    assigned_agent_id: agentFilter || undefined,
    q: q || undefined, skip, limit: PAGE_SIZE,
  };

  const { data, isLoading, error } = useLeads(params);
  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];
  const agentMap = new Map(agents.map(a => [a.id, a.full_name]));
  const leads = data?.items ?? [];
  const total = data?.total ?? 0;

  if (error) return <p className="text-sm text-destructive">Failed to load leads.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search customer…" value={q} onChange={e => { setQ(e.target.value); setSkip(0); }} className="w-56" />
        <Select value={stage} onValueChange={v => { setStage(v as LeadStage | "all"); setSkip(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter || "all"} onValueChange={v => { setAgentFilter(v === "all" ? "" : v); setSkip(0); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All agents" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{total} leads</span>
        <Button onClick={() => setShowCreate(true)}>+ New Lead</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Customer</th>
              <th className="px-3 py-2 text-left font-medium">Source</th>
              <th className="px-3 py-2 text-left font-medium">Stage</th>
              <th className="px-3 py-2 text-left font-medium">Agent</th>
              <th className="px-3 py-2 text-left font-medium">Next action</th>
              <th className="px-3 py-2 text-left font-medium">Created</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {leads.map(l => {
              const nextAction = l.next_action_at;
              const overdue = nextAction && new Date(nextAction).getTime() < Date.now();
              return (
                <tr key={l.id} className="border-b">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{l.customer?.full_name ?? "—"}</p>
                    {l.customer?.phone && <p className="text-xs text-muted-foreground">{l.customer.phone}</p>}
                  </td>
                  <td className="px-3 py-2.5"><SourceBadge source={l.source} /></td>
                  <td className="px-3 py-2.5"><LeadStageBadge stage={l.stage} /></td>
                  <td className={cn("px-3 py-2.5 text-sm", !l.assigned_agent_id && "text-muted-foreground")}>
                    {l.assigned_agent_id ? agentMap.get(l.assigned_agent_id) ?? "—" : "Unassigned"}
                  </td>
                  <td className={cn("px-3 py-2.5 text-sm", overdue && "text-destructive font-medium")}>
                    {relativeDate(l.next_action_at)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("en-AE")}
                  </td>
                  <td className="px-3 py-2.5">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/leads/${l.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && leads.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No leads found</p>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))} disabled={skip === 0}>Previous</Button>
          <span className="text-sm text-muted-foreground">{skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}</span>
          <Button variant="outline" size="sm" onClick={() => setSkip(skip + PAGE_SIZE)} disabled={skip + PAGE_SIZE >= total}>Next</Button>
        </div>
      )}

      <LeadCreateDialog open={showCreate} onClose={() => setShowCreate(false)} agents={agents} />
    </div>
  );
}
