"use client";

import { useState } from "react";
import Link from "next/link";
import { useDeals } from "@/hooks/queries/useDeals";
import { useAgents } from "@/hooks/queries/useAgents";
import { DealStageBadge } from "@/components/atoms/DealStageBadge";
import { DealTypeBadge } from "@/components/atoms/DealTypeBadge";
import { PayoutStatusBadge } from "@/components/atoms/PayoutStatusBadge";
import { DealCreateDialog } from "@/components/organisms/DealCreateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DealStage, DealType } from "@/lib/types/deal";

const STAGES: DealStage[] = ["initiated","documents_pending","deposit_pending","closed_won","closed_lost","canceled"];
const TYPES: DealType[] = ["sale","rent_short","rent_long"];

function fmt(value: string, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AE", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch { return `${currency} ${value}`; }
}

function relDate(d: string | null): string {
  if (!d) return "—";
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "today";
  return `in ${diff}d`;
}

export function DealsTable(): React.ReactElement {
  const [stage, setStage] = useState<DealStage | "all">("all");
  const [dealType, setDealType] = useState<DealType | "all">("all");
  const [agentFilter, setAgentFilter] = useState("");
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = useDeals({
    stage: stage === "all" ? undefined : stage,
    deal_type: dealType === "all" ? undefined : dealType,
    primary_agent_id: agentFilter || undefined,
    q: q || undefined,
  });
  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];
  const deals = data?.items ?? [];

  if (error) return <p className="text-sm text-destructive">Failed to load deals.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search customer…" value={q} onChange={e => setQ(e.target.value)} className="w-52" />
        <Select value={stage} onValueChange={v => setStage(v as DealStage | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dealType} onValueChange={v => setDealType(v as DealType | "all")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter || "all"} onValueChange={v => setAgentFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All agents" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{data?.total ?? 0} deals</span>
        <Button onClick={() => setShowCreate(true)}>+ New Deal</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Customer</th>
              <th className="px-3 py-2 text-left font-medium">Property</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Stage</th>
              <th className="px-3 py-2 text-left font-medium">Value</th>
              <th className="px-3 py-2 text-left font-medium">Commission</th>
              <th className="px-3 py-2 text-left font-medium">Close</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {deals.map(d => (
              <tr key={d.id} className="border-b">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{d.customer?.full_name ?? "—"}</p>
                  {d.customer?.phone && <p className="text-xs text-muted-foreground">{d.customer.phone}</p>}
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/properties/${d.property_id}`} className="text-primary hover:underline text-sm">
                    {d.interest_property?.title ?? d.property_id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2.5"><DealTypeBadge type={d.deal_type} /></td>
                <td className="px-3 py-2.5"><DealStageBadge stage={d.stage} /></td>
                <td className="px-3 py-2.5 text-sm">{fmt(d.transaction_value, d.transaction_currency)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{fmt(d.commission_amount, d.transaction_currency)}</span>
                    <PayoutStatusBadge status={d.commission_payout_status} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">{relDate(d.expected_close_at)}</td>
                <td className="px-3 py-2.5">
                  <Button size="sm" variant="outline" asChild><Link href={`/deals/${d.id}`}>Open</Link></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && deals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No deals found</p>}
      </div>

      <DealCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
