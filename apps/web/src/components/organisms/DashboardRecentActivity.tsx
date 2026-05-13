"use client";

import { Activity } from "lucide-react";

// TODO: when GET /audit-logs (tenant-scoped, no entity filter) is implemented,
// replace this stub with a useQuery call.
// Endpoint needed: GET /audit-logs?limit=10 (no entity_type required for dashboard view)

export function DashboardRecentActivity(): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
        <Activity className="h-4 w-4 text-slate-300" />
      </div>

      <div className="px-5">
        {/* Placeholder — real data pending audit-log tenant-list endpoint */}
        <div className="py-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-slate-200" />
          <p className="mt-2 text-sm font-medium text-slate-400">Activity feed coming soon</p>
          <p className="text-xs text-slate-300">
            Waiting for tenant-scoped audit log endpoint
          </p>
        </div>
      </div>
    </div>
  );
}
