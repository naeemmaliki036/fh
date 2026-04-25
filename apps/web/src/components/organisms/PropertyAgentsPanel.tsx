"use client";

import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { useAgents } from "@/hooks/queries/useAgents";
import {
  useAssignAgent,
  useUpdateAgentAssignment,
  useUnassignAgent,
} from "@/hooks/mutations/usePropertyMutations";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { PropertyAgentAssignment } from "@/lib/types/property";

interface PropertyAgentsPanelProps {
  propertyId: string;
  assignedAgents: PropertyAgentAssignment[];
}

export function PropertyAgentsPanel({ propertyId, assignedAgents }: PropertyAgentsPanelProps): React.ReactElement {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const { data: agentsData } = useAgents();
  const { mutate: assign, isPending: assigning } = useAssignAgent(propertyId);
  const { mutate: updateAssignment } = useUpdateAgentAssignment(propertyId);
  const { mutate: unassign } = useUnassignAgent(propertyId);

  const allAgents = agentsData?.items ?? [];
  const assignedIds = new Set(assignedAgents.map(a => a.agent_id));
  const available = allAgents.filter(a => !assignedIds.has(a.id));
  const agentMap = new Map(allAgents.map(a => [a.id, a]));

  const handleAdd = (): void => {
    if (!selectedAgentId) return;
    const isFirst = assignedAgents.length === 0;
    assign({ agent_id: selectedAgentId, is_primary: isFirst });
    setSelectedAgentId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pick an agent to add" />
          </SelectTrigger>
          <SelectContent>
            {available.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={!selectedAgentId || assigning} size="sm">
          + Add Agent
        </Button>
      </div>

      {assignedAgents.length === 0 && (
        <p className="text-sm text-muted-foreground">No agents assigned yet.</p>
      )}

      <div className="space-y-2">
        {assignedAgents.map(a => {
          const agent = agentMap.get(a.agent_id);
          return (
            <div key={a.agent_id}
              className={cn("flex items-center justify-between rounded-md border px-4 py-2.5", a.is_primary && "border-primary/50 bg-primary/5")}>
              <div className="flex items-center gap-2">
                {a.is_primary && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                <span className="text-sm font-medium">{agent?.full_name ?? a.agent_id}</span>
                {a.is_primary && <span className="text-xs text-muted-foreground">(primary)</span>}
              </div>
              <div className="flex gap-2">
                {!a.is_primary && (
                  <Button size="sm" variant="outline"
                    onClick={() => updateAssignment({ agentId: a.agent_id, body: { is_primary: true } })}>
                    Set Primary
                  </Button>
                )}
                <Button size="icon" variant="ghost"
                  onClick={() => unassign(a.agent_id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
