"use client";

import { useState } from "react";
import { PendingDocumentsQueue } from "@/components/organisms/PendingDocumentsQueue";

export default function PendingDocumentsPage(): React.ReactElement {
  const [entityType, setEntityType] = useState<string>("");
  const [assignedToMe, setAssignedToMe] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve or reject uploaded documents
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Entity type</label>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="">All</option>
            <option value="customer">Customer</option>
            <option value="lead">Lead</option>
            <option value="deal">Deal</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => setAssignedToMe(e.target.checked)}
            className="rounded border-input"
          />
          Assigned to me only
        </label>
      </div>

      <PendingDocumentsQueue
        entityType={entityType || undefined}
        assignedToMe={assignedToMe}
      />
    </div>
  );
}
