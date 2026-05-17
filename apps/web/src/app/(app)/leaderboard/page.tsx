"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/molecules/TableSkeleton";
import type { LeaderboardPeriod } from "@/lib/types/deal";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

type SortKey = "deals_won_count" | "total_commission_value";

const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);

function fmt(n: number): string {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n);
}

export default function LeaderboardPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>("this_month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("deals_won_count");

  const { data, isLoading } = useLeaderboard({ period, from: from || undefined, to: to || undefined });

  if (!currentUser || !ADMIN_ROLES.has(currentUser.role)) {
    return <p className="p-6 text-sm text-muted-foreground">Access restricted to company owners and admins.</p>;
  }

  const rows = [...(data?.rows ?? [])].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Agent performance rankings</p>
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
        {period === "custom" && (() => {
          // Historic report — no future dates, and From must be ≤ To.
          const todayIso = new Date().toISOString().slice(0, 10);
          const fromOver = !!from && !!to && from > to;
          return (
            <>
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input
                  type="date"
                  value={from}
                  max={to || todayIso}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-40"
                />
                {fromOver && <p className="text-xs text-destructive">Must be on or before "To"</p>}
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  value={to}
                  min={from || undefined}
                  max={todayIso}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </>
          );
        })()}
        <div className="space-y-1.5">
          <Label>Sort by</Label>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="deals_won_count">Deals won</SelectItem>
              <SelectItem value="total_commission_value">Total commission</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <TableSkeleton cols={8} rows={5} />}

      {!isLoading && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Rank</th>
                <th className="px-3 py-2 text-left font-medium">Agent</th>
                <th className="px-3 py-2 text-right font-medium">Deals Won</th>
                <th className="px-3 py-2 text-right font-medium">Sold</th>
                <th className="px-3 py-2 text-right font-medium">Rented</th>
                <th className="px-3 py-2 text-right font-medium">Transaction Value</th>
                <th className="px-3 py-2 text-right font-medium">Total Commission</th>
                <th className="px-3 py-2 text-right font-medium">Paid / Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.agent_id} className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{row.agent_name}</td>
                  <td className="px-3 py-2.5 text-right">{row.deals_won_count}</td>
                  <td className="px-3 py-2.5 text-right">{row.sold_count}</td>
                  <td className="px-3 py-2.5 text-right">{row.rented_count}</td>
                  <td className="px-3 py-2.5 text-right">{fmt(row.total_transaction_value)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt(row.total_commission_value)}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                    {fmt(row.paid_commission)} / {fmt(row.pending_commission)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No data for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
