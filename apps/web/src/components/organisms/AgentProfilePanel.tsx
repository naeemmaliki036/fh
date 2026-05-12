"use client";

import { AgentPhotoUploader } from "@/components/molecules/AgentPhotoUploader";
import { AgentForm } from "@/components/molecules/AgentForm";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { useUpdateAgent } from "@/hooks/mutations/useAgentMutations";
import type { Agent, AgentCreateRequest, AgentUpdateRequest } from "@/lib/types";

interface AgentProfilePanelProps {
  agent: Agent;
}

export function AgentProfilePanel({ agent }: AgentProfilePanelProps): React.ReactElement {
  const { mutate: update, isPending } = useUpdateAgent(agent.id);

  const handleSubmit = (data: AgentCreateRequest | AgentUpdateRequest): void => {
    update(data as AgentUpdateRequest);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <AgentPhotoUploader agentId={agent.id} currentUrl={agent.photo_url} />
        <div>
          <h2 className="text-lg font-semibold">{agent.full_name}</h2>
          <p className="text-sm text-muted-foreground">{agent.email}</p>
          <div className="mt-1">
            <StatusBadge status={agent.status} />
          </div>
        </div>
      </div>

      <AgentForm
        defaultValues={agent}
        isPending={isPending}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => { /* reset happens inside AgentForm */ }}
      />
    </div>
  );
}
