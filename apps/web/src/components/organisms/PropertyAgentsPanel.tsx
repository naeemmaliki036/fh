"use client";

import { useState } from "react";
import { Star, Trash2, Pencil, X } from "lucide-react";
import { useAgents } from "@/hooks/queries/useAgents";
import { usePropertyAgents } from "@/hooks/queries/useProperties";
import {
  useAssignAgent,
  useUpdateAgentAssignment,
  useUnassignAgent,
  useSetCommissionOverride,
  useClearCommissionOverride,
} from "@/hooks/mutations/usePropertyMutations";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { PropertyAgentOverrideDialog } from "@/components/molecules/PropertyAgentOverrideDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { PropertyAgentCommissionOverrideRequest } from "@/lib/types/property";

interface PropertyAgentsPanelProps {
  propertyId: string;
  canOverride?: boolean;
}

function formatOverride(type: string | null, value: string | null): string | null {
  if (!type || !value) return null;
  if (type === "percentage") return `Override: ${value}% of company commission`;
  return `Override: ${Number(value).toLocaleString()} AED fixed`;
}

export function PropertyAgentsPanel({
  propertyId,
  canOverride = false,
}: PropertyAgentsPanelProps): React.ReactElement {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null);

  const { data: agentsData } = useAgents();
  const { data: propertyAgents = [], isLoading } = usePropertyAgents(propertyId);
  const { mutate: assign, isPending: assigning } = useAssignAgent(propertyId);
  const { mutate: updateAssignment } = useUpdateAgentAssignment(propertyId);
  const { mutate: unassign } = useUnassignAgent(propertyId);
  const { mutate: setOverride, isPending: savingOverride } = useSetCommissionOverride(propertyId);
  const { mutate: clearOverride } = useClearCommissionOverride(propertyId);

  const allAgents = agentsData?.items ?? [];
  const assignedIds = new Set(propertyAgents.map((a) => a.agent_id));
  const available = allAgents.filter((a) => !assignedIds.has(a.id));

  const handleAdd = (): void => {
    if (!selectedAgentId) return;
    const isFirst = propertyAgents.length === 0;
    assign({ agent_id: selectedAgentId, is_primary: isFirst });
    setSelectedAgentId("");
  };

  const activeOverrideAgent = propertyAgents.find((a) => a.agent_id === overrideTarget);

  const handleSaveOverride = (data: PropertyAgentCommissionOverrideRequest): void => {
    if (!overrideTarget) return;
    setOverride(
      { agentId: overrideTarget, body: data },
      { onSuccess: () => setOverrideTarget(null) },
    );
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading agents…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Add agent row */}
      <div className="flex gap-2 items-center">
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pick an agent to add" />
          </SelectTrigger>
          <SelectContent>
            {available.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={!selectedAgentId || assigning} size="sm">
          + Add Agent
        </Button>
      </div>

      {propertyAgents.length === 0 && (
        <p className="text-sm text-muted-foreground">No agents assigned yet.</p>
      )}

      <div className="space-y-2">
        {propertyAgents.map((a) => {
          const overridePill = formatOverride(a.commission_override_type, a.commission_override_value);
          return (
            <div
              key={a.agent_id}
              className={cn(
                "rounded-xl border px-4 py-3 space-y-2",
                a.is_primary && "border-primary/50 bg-primary/5",
              )}
            >
              {/* Name + primary badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {a.is_primary && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                  <span className="text-sm font-medium">{a.agent_full_name}</span>
                  {a.is_primary && (
                    <span className="text-xs text-muted-foreground">(primary)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!a.is_primary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateAssignment({ agentId: a.agent_id, body: { is_primary: true } })
                      }
                    >
                      Set Primary
                    </Button>
                  )}
                  <ConfirmDialog
                    trigger={
                      <Button size="icon" variant="ghost" aria-label="Remove agent">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    }
                    title="Remove agent from property?"
                    description={`${a.agent_full_name} will no longer be assigned to this property.`}
                    confirmLabel="Remove"
                    variant="destructive"
                    onConfirm={() => unassign(a.agent_id)}
                  />
                </div>
              </div>

              {/* Override slot */}
              <div className="flex items-center gap-2 flex-wrap">
                {overridePill ? (
                  <>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      {overridePill}
                    </span>
                    {canOverride && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => setOverrideTarget(a.agent_id)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />Edit override
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <X className="h-3 w-3 mr-1" />Clear override
                            </Button>
                          }
                          title="Clear commission override?"
                          description="The agent's default commission rate will apply to new deals on this property."
                          confirmLabel="Clear"
                          variant="destructive"
                          onConfirm={() => clearOverride(a.agent_id)}
                        />
                      </>
                    )}
                  </>
                ) : (
                  canOverride && (
                    <Button
                      size="sm"
                      variant="link"
                      className="h-6 px-0 text-xs"
                      onClick={() => setOverrideTarget(a.agent_id)}
                    >
                      Set property-specific commission
                    </Button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {overrideTarget && activeOverrideAgent && (
        <PropertyAgentOverrideDialog
          open
          agentName={activeOverrideAgent.agent_full_name}
          onOpenChange={(o) => { if (!o) setOverrideTarget(null); }}
          onSave={handleSaveOverride}
          isPending={savingOverride}
        />
      )}
    </div>
  );
}
