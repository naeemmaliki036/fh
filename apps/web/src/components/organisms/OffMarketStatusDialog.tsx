"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOffMarketReasons } from "@/hooks/queries/useOffMarketReasons";

interface OffMarketStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reasonCode: string, reasonNote: string | null) => Promise<void>;
}

export function OffMarketStatusDialog({
  open,
  onOpenChange,
  onConfirm,
}: OffMarketStatusDialogProps): React.ReactElement {
  const [reasonCode, setReasonCode] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { data: reasons, isLoading } = useOffMarketReasons();

  const allReasons = reasons ?? [];
  const selected = allReasons.find((r) => r.code === reasonCode);
  const noteRequired = selected?.requires_note || selected?.code === "other";

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      setReasonCode("");
      setReasonNote("");
    }
    onOpenChange(next);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!reasonCode) return;
    if (noteRequired && !reasonNote.trim()) return;
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
        <DialogHeader>
          <DialogTitle>Mark Off-Market</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="om-reason">Reason *</Label>
            {isLoading
              ? <p className="text-sm text-muted-foreground">Loading reasons…</p>
              : (
                <Select value={reasonCode} onValueChange={setReasonCode}>
                  <SelectTrigger id="om-reason"><SelectValue placeholder="Select reason…" /></SelectTrigger>
                  <SelectContent>
                    {allReasons.sort((a, b) => a.ordering - b.ordering).map((r) => (
                      <SelectItem key={r.id} value={r.code}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="om-note">
              {noteRequired ? "Note *" : "Note (optional)"}
            </Label>
            <textarea
              id="om-note"
              rows={3}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Additional context…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!reasonCode || (noteRequired && !reasonNote.trim()) || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Saving…" : "Confirm off-market"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
