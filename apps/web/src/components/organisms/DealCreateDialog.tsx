"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DealForm } from "@/components/molecules/DealForm";
import { useCreateDeal } from "@/hooks/mutations/useDealMutations";
import { useAgents } from "@/hooks/queries/useAgents";
import type { DealCreateRequest } from "@/lib/types/deal";

interface DealCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DealCreateDialog({ open, onClose }: DealCreateDialogProps): React.ReactElement {
  const { data: agentsData } = useAgents();
  const { mutate: create, isPending } = useCreateDeal();

  const agents = agentsData?.items ?? [];

  const handleSubmit = (data: DealCreateRequest): void => {
    create(data, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
        <DealForm
          agents={agents}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
