"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentForm } from "@/components/molecules/AgentForm";
import { useCreateAgent } from "@/hooks/mutations/useAgentMutations";
import type { AgentCreateRequest, AgentUpdateRequest } from "@/lib/types";

interface AgentCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AgentCreateDialog({ open, onClose }: AgentCreateDialogProps): React.ReactElement {
  const { mutate: create, isPending } = useCreateAgent();

  const handleSubmit = (data: AgentCreateRequest | AgentUpdateRequest): void => {
    create(data as AgentCreateRequest, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Agent</DialogTitle>
        </DialogHeader>
        <AgentForm
          isPending={isPending}
          submitLabel="Create agent"
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
