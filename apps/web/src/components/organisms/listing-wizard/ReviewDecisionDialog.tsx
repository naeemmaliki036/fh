"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useReviewDecision, usePublishListing } from "@/hooks/mutations/useListingReviewMutations";

interface ReviewDecisionDialogProps {
  listingId: string;
  decision: "approved" | "changes_requested";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TITLE: Record<"approved" | "changes_requested", string> = {
  approved: "Approve Listing",
  changes_requested: "Request Changes",
};

const SUBMIT_LABEL: Record<"approved" | "changes_requested", string> = {
  approved: "Approve",
  changes_requested: "Request Changes",
};

export function ReviewDecisionDialog({
  listingId,
  decision,
  open,
  onOpenChange,
  onSuccess,
}: ReviewDecisionDialogProps): React.ReactElement {
  const [note, setNote] = useState("");
  const [publishAfter, setPublishAfter] = useState(false);
  const { mutateAsync: decide, isPending: deciding } = useReviewDecision(listingId);
  const { mutateAsync: publish, isPending: publishing } = usePublishListing(listingId);
  const isPending = deciding || publishing;

  const handleSubmit = async (): Promise<void> => {
    await decide({ decision, note: note || null });
    if (decision === "approved" && publishAfter) {
      await publish();
    }
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLE[decision]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">Note (optional)</Label>
            <textarea
              id="decision-note"
              rows={4}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                decision === "changes_requested"
                  ? "Describe what needs to be changed…"
                  : "Any approval notes…"
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/1000</p>
          </div>

          {decision === "approved" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publishAfter}
                onChange={(e) => setPublishAfter(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Publish to market immediately after approval</span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            variant={decision === "approved" ? "default" : "outline"}
            className={decision === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-amber-400 text-amber-700 hover:bg-amber-50"}
          >
            {isPending
              ? "Submitting…"
              : decision === "approved" && publishAfter
              ? "Approve & Publish"
              : SUBMIT_LABEL[decision]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
