"use client";

import { TrendingUp } from "lucide-react";

interface DashboardPipelineProps {
  leadsTotal: number;
  dealsTotal: number;
}

interface PipelineBarProps {
  label: string;
  count: number;
  color: string;
  max: number;
}

function PipelineBar({ label, count, color, max }: PipelineBarProps): React.ReactElement {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-800">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardPipeline({
  leadsTotal,
  dealsTotal,
}: DashboardPipelineProps): React.ReactElement {
  const total = leadsTotal + dealsTotal;

  // TODO: when /leads?stage=X counts per stage are available, replace these
  // with real stage breakdowns. Endpoint needed: GET /leads/stage-counts
  const stages = [
    { label: "Open Leads", count: leadsTotal, color: "bg-blue-500" },
    { label: "Pending Deals", count: dealsTotal, color: "bg-amber-500" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Pipeline</h2>
        <TrendingUp className="h-4 w-4 text-slate-300" />
      </div>

      <div className="px-5 py-4 space-y-5">
        {stages.map((s) => (
          <PipelineBar key={s.label} {...s} max={Math.max(total, 1)} />
        ))}

        {total === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">No pipeline data yet</p>
        )}

        {/* Summary */}
        {total > 0 && (
          <div className="mt-2 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Total pipeline items:{" "}
              <span className="font-bold text-slate-800">{total}</span>
            </p>
            {/* TODO: add conversion rate when historical deal data endpoint exists */}
          </div>
        )}
      </div>
    </div>
  );
}
