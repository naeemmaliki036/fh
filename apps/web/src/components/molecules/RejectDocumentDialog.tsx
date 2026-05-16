"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RejectDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}

export function RejectDocumentDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: RejectDocumentDialogProps): React.ReactElement {
  const [reason, setReason] = useState("");

  const handleSubmit = (): void => {
    if (reason.trim().length >= 5) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject document</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason (min 5 characters) *</Label>
          <textarea
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this document is rejected…"
          />
          {reason.length > 0 && reason.trim().length < 5 && (
            <p className="text-xs text-destructive">Reason must be at least 5 characters</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setReason(""); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || reason.trim().length < 5}
            onClick={handleSubmit}
          >
            {isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
