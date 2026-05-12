"use client";

import { useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReasonOption = { value: string; label: string };

export interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  reasonOptions: ReasonOption[];
  destructive?: boolean;
  onConfirm: (reason_code: string, reason_note: string | null) => Promise<void>;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  title,
  description,
  reasonOptions,
  destructive = false,
  onConfirm,
}: StatusChangeDialogProps): ReactElement {
  const [step, setStep] = useState<1 | 2>(1);
  const [reasonCode, setReasonCode] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      setStep(1);
      setReasonCode("");
      setReasonNote("");
    }
    onOpenChange(next);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!reasonCode) return;
    setIsPending(true);
    try {
      await onConfirm(reasonCode, reasonNote.trim() || null);
      handleOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant={destructive ? "destructive" : "default"}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Select a reason</DialogTitle>
              <DialogDescription>
                Choose the reason for this status change.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="reason-select">Reason *</Label>
                <Select value={reasonCode} onValueChange={setReasonCode}>
                  <SelectTrigger id="reason-select">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason-note">Additional notes (optional)</Label>
                <textarea
                  id="reason-note"
                  rows={3}
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Any additional context..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant={destructive ? "destructive" : "default"}
                disabled={!reasonCode || isPending}
                onClick={handleConfirm}
              >
                {isPending ? "Saving..." : "Confirm change"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
