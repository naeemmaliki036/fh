"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTransitionLead } from "@/hooks/mutations/useLeadMutations";
import { STAGE_TRANSITIONS, TERMINAL_STAGES } from "@/lib/types/lead";
import type { LeadStage } from "@/lib/types/lead";

const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  viewing: "Viewing", offer: "Offer", won: "Won", lost: "Lost",
};

interface StageTransitionMenuProps {
  leadId: string;
  currentStage: LeadStage;
}

export function StageTransitionMenu({ leadId, currentStage }: StageTransitionMenuProps): React.ReactElement {
  const [pendingStage, setPendingStage] = useState<LeadStage | null>(null);
  const [description, setDescription] = useState("");
  const { mutate: transition, isPending } = useTransitionLead(leadId);

  const nextStages = STAGE_TRANSITIONS[currentStage];
  if (nextStages.length === 0) return <p className="text-xs text-muted-foreground">Terminal stage — no further transitions</p>;

  const handleSelect = (stage: LeadStage): void => {
    setPendingStage(stage);
    if (!TERMINAL_STAGES.has(stage)) { doTransition(stage); }
  };

  const doTransition = (stage: LeadStage): void => {
    transition({ stage, description: description || null }, {
      onSuccess: () => { setPendingStage(null); setDescription(""); },
    });
  };

  return (
    <>
      <div className="space-y-1.5">
        <Label>Move to stage</Label>
        <Select value="" onValueChange={(v) => handleSelect(v as LeadStage)}>
          <SelectTrigger>
            <SelectValue placeholder="Select next stage…" />
          </SelectTrigger>
          <SelectContent>
            {nextStages.map(s => (
              <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pendingStage && TERMINAL_STAGES.has(pendingStage) && (
        <Dialog open onOpenChange={() => setPendingStage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm terminal stage: {STAGE_LABELS[pendingStage]}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This is a terminal stage. The lead cannot be moved further. Continue?
            </p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Reason (optional)"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingStage(null)}>Cancel</Button>
              <Button
                variant={pendingStage === "won" ? "default" : "destructive"}
                disabled={isPending}
                onClick={() => doTransition(pendingStage)}
              >
                {isPending ? "Saving..." : `Mark as ${STAGE_LABELS[pendingStage]}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
