"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useLeads } from "@/hooks/queries/useLeads";

export function DashboardActionRequired(): React.ReactElement {
  // TODO: when /leads?stage=overdue endpoint exists, use it here for genuine overdue count
  const { data: leadsData, isLoading } = useLeads({ limit: 5 });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Action Required</h2>
        <Link
          href="/leads"
          className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-slate-50 px-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))
        ) : leadsData && leadsData.total > 0 ? (
          <div className="py-3">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {leadsData.total} open lead{leadsData.total !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-amber-600">Review and assign to agents</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400">No pending actions</p>
          </div>
        )}
      </div>

    </div>
  );
}
