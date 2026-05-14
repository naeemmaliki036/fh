"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeaderboardPeriod } from "@/lib/types/deal";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

function fmt(n: number): string {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);
}

export default function MyEarningsPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("this_month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useLeaderboard({ period, from: from || undefined, to: to || undefined });

  if (!currentUser) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  const myRow = data?.rows.find((r) => r.agent_id === currentUser.id) ?? null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">Your commission and deal performance</p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Period</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {period === "custom" && (
          <>
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
          </>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading earnings…</p>}

      {!isLoading && !myRow && (
        <p className="text-sm text-muted-foreground py-8 text-center">No deals found for this period.</p>
      )}

      {!isLoading && myRow && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Deals Won", value: String(myRow.deals_won_count) },
            { label: "Sold", value: String(myRow.sold_count) },
            { label: "Rented", value: String(myRow.rented_count) },
            { label: "Total Transaction Value", value: fmt(myRow.total_transaction_value) },
            { label: "Total Commission", value: fmt(myRow.total_commission_value) },
            { label: "Paid Commission", value: fmt(myRow.paid_commission) },
            { label: "Pending Commission", value: fmt(myRow.pending_commission) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-md border p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
