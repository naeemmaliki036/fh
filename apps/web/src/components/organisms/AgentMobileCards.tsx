"use client";

import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CommissionBadge } from "@/components/atoms/CommissionBadge";
import { LicenseExpiryBadge, isExpiringWithin30Days } from "@/components/atoms/LicenseExpiryBadge";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Agent, AgentStatus } from "@/lib/types";

interface Transition {
  label: string;
  status: AgentStatus;
  destructive: boolean;
}

interface PendingTransition {
  agent: Agent;
  targetStatus: AgentStatus;
  title: string;
  description: string;
  destructive: boolean;
}

interface AgentMobileCardsProps {
  agents: Agent[];
  isLoading: boolean;
  locale: string | null | undefined;
  getTransitions: (agent: Agent) => Transition[];
  onCreateClick: () => void;
  onPending: (t: PendingTransition) => void;
}

function transitionDescription(status: AgentStatus): string {
  if (status === "inactive") return "This agent will not appear in new deals or assignments.";
  if (status === "on_leave") return "This agent will be marked as on leave.";
  return "This agent will be restored to an active state.";
}

export function AgentMobileCards({
  agents,
  isLoading,
  locale,
  getTransitions,
  onCreateClick,
  onPending,
}: AgentMobileCardsProps): React.ReactElement {
  return (
    <div className="lg:hidden space-y-3">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse h-36" />
          ))}
        </div>
      )}
      {!isLoading && agents.length === 0 && (
        <EmptyState
          icon={Users}
          title="No agents yet"
          description="Add your first agent to start assigning deals."
          cta={
            <Button size="sm" onClick={onCreateClick}>
              <Plus className="mr-1.5 h-4 w-4" />New Agent
            </Button>
          }
        />
      )}
      {!isLoading && agents.map((agent) => {
        const expiryWarning = isExpiringWithin30Days(agent.license_expiry_at);
        const transitions = getTransitions(agent);
        return (
          <div
            key={agent.id}
            className={cn(
              "rounded-xl border bg-card p-4",
              expiryWarning && "border-amber-300 bg-amber-50/40",
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {agent.photo_url
                    ? <img src={agent.photo_url} alt="" className="h-full w-full object-cover" />
                    : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        {agent.full_name.charAt(0).toUpperCase()}
                      </span>
                    )
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{agent.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                </div>
              </div>
              <StatusBadge status={agent.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-3">
              <dt className="text-muted-foreground">License</dt>
              <dd className="truncate">{agent.license_id ?? "—"}</dd>
              <dt className="text-muted-foreground">Expiry</dt>
              <dd><LicenseExpiryBadge expiryDate={agent.license_expiry_at} locale={locale} /></dd>
              <dt className="text-muted-foreground">Commission</dt>
              <dd>
                <CommissionBadge
                  type={agent.default_commission_type}
                  value={agent.default_commission_value}
                />
              </dd>
            </dl>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/agents/${agent.id}`}>Edit</Link>
              </Button>
              {transitions.map((t) => (
                <Button
                  key={t.status}
                  size="sm"
                  variant={t.destructive ? "destructive" : "secondary"}
                  onClick={() =>
                    onPending({
                      agent,
                      targetStatus: t.status,
                      title: `${t.label} ${agent.full_name}?`,
                      description: transitionDescription(t.status),
                      destructive: t.destructive,
                    })
                  }
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
