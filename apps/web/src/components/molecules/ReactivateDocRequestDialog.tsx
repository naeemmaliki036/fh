"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ReactivateDocRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: (expiresInDays: number) => void;
}

export function ReactivateDocRequestDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: ReactivateDocRequestDialogProps): React.ReactElement {
  const [days, setDays] = useState(7);

  const previewDate = new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-AE", {
    year: "numeric", month: "short", day: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reactivate upload link</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>
              Link expires in (days): <span className="font-semibold">{days}</span>
            </Label>
            <input
              type="range"
              min={7}
              max={14}
              step={1}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Link will expire on <strong>{previewDate}</strong>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={isPending} onClick={() => onConfirm(days)}>
            {isPending ? "Reactivating…" : "Reactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
