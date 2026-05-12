"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { useAgents } from "@/hooks/queries/useAgents";
import { useChangeAgentStatus } from "@/hooks/mutations/useAgentMutations";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CommissionBadge } from "@/components/atoms/CommissionBadge";
import { LicenseExpiryBadge, isExpiringWithin30Days } from "@/components/atoms/LicenseExpiryBadge";
import { AgentCreateDialog } from "@/components/organisms/AgentCreateDialog";
import { StatusChangeDialog } from "@/components/molecules/StatusChangeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import {
  AGENT_INACTIVE_REASONS,
  AGENT_ACTIVE_REASONS,
  AGENT_ON_LEAVE_REASONS,
} from "@/lib/constants/status-reasons";
import type { Agent, AgentStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: AgentStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

type PendingTransition = {
  agent: Agent;
  targetStatus: AgentStatus;
  title: string;
  description: string;
  destructive: boolean;
};

function getTransitions(agent: Agent): { label: string; status: AgentStatus; destructive: boolean }[] {
  switch (agent.status) {
    case "active":
      return [
        { label: "Mark on leave", status: "on_leave", destructive: false },
        { label: "Disable", status: "inactive", destructive: true },
      ];
    case "inactive":
      return [{ label: "Enable", status: "active", destructive: false }];
    case "on_leave":
      return [
        { label: "Enable", status: "active", destructive: false },
        { label: "Disable", status: "inactive", destructive: true },
      ];
  }
}

function reasonOptions(targetStatus: AgentStatus) {
  if (targetStatus === "inactive") return AGENT_INACTIVE_REASONS;
  if (targetStatus === "active") return AGENT_ACTIVE_REASONS;
  return AGENT_ON_LEAVE_REASONS;
}

export function AgentsTable(): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [pending, setPending] = useState<PendingTransition | null>(null);

  const { data, isLoading, error } = useAgents({
    status: statusFilter === "all" ? undefined : statusFilter,
    q: search || undefined,
  });
  const { mutateAsync: changeStatus } = useChangeAgentStatus();

  if (error) return <p className="text-sm text-destructive">Failed to load agents.</p>;

  const agents = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as AgentStatus | "all")}
        >
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{data?.total ?? 0} agents</span>
        <Button onClick={() => setShowCreate(true)}>+ New Agent</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading agents...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-3 text-left font-medium">Agent</th>
                <th className="px-3 py-3 text-left font-medium">License</th>
                <th className="px-3 py-3 text-left font-medium">Expiry</th>
                <th className="px-3 py-3 text-left font-medium">Commission</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-3 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const expiryWarning = isExpiringWithin30Days(agent.license_expiry_at);
                const transitions = getTransitions(agent);
                return (
                  <tr
                    key={agent.id}
                    className={cn("border-b", expiryWarning && "bg-yellow-50/60")}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {agent.photo_url
                            ? <img src={agent.photo_url} alt="" className="h-full w-full object-cover" />
                            : <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                {agent.full_name.charAt(0).toUpperCase()}
                              </span>
                          }
                        </div>
                        <div>
                          <p className="font-medium">{agent.full_name}</p>
                          <p className="text-xs text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{agent.license_id ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <LicenseExpiryBadge expiryDate={agent.license_expiry_at} />
                    </td>
                    <td className="px-3 py-2.5">
                      <CommissionBadge type={agent.default_commission_type} value={agent.default_commission_value} />
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={agent.status} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5 flex-wrap">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/agents/${agent.id}`}>Edit</Link>
                        </Button>
                        {transitions.map((t) => (
                          <Button
                            key={t.status}
                            size="sm"
                            variant={t.destructive ? "destructive" : "secondary"}
                            onClick={() =>
                              setPending({
                                agent,
                                targetStatus: t.status,
                                title: `${t.label} ${agent.full_name}?`,
                                description:
                                  t.status === "inactive"
                                    ? "This agent will not appear in new deals or assignments."
                                    : t.status === "on_leave"
                                    ? "This agent will be marked as on leave."
                                    : "This agent will be restored to an active state.",
                                destructive: t.destructive,
                              })
                            }
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {agents.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Users className="h-8 w-8 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium">No agents yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Add your first agent to start assigning deals.</p>
                  </div>
                  <Button size="sm" onClick={() => setShowCreate(true)}>+ New Agent</Button>
                </div>
              </td>
            </tr>
          )}
        </div>
      )}

      <AgentCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />

      {pending && (
        <StatusChangeDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null); }}
          title={pending.title}
          description={pending.description}
          reasonOptions={reasonOptions(pending.targetStatus)}
          destructive={pending.destructive}
          onConfirm={async (reason_code, reason_note) => {
            await changeStatus({
              id: pending.agent.id,
              status: pending.targetStatus,
              reason_code,
              reason_note,
            });
          }}
        />
      )}
    </div>
  );
}
