"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateCommissionRate } from "@/hooks/mutations/useUpdateCommissionRate";
import type { TenantCommissionRate, TransactionType } from "@/lib/types";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types";

// Rate validation: 0.1% to 10% in percent units
const MIN_RATE_PCT = 0.1;
const MAX_RATE_PCT = 10;

function toPercent(decimal: number): string {
  return (decimal * 100).toFixed(4).replace(/\.?0+$/, "");
}

type Step = "edit" | "confirm";

interface Props {
  rate: TenantCommissionRate;
  open: boolean;
  onClose: () => void;
}

export function CommissionRateEditDialog({ rate, open, onClose }: Props): React.ReactElement {
  const [step, setStep] = useState<Step>("edit");
  const [rateInput, setRateInput] = useState(toPercent(rate.rate));
  const [notes, setNotes] = useState(rate.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useUpdateCommissionRate();

  // Reset when dialog opens with a new rate
  useEffect(() => {
    if (open) {
      setStep("edit");
      setRateInput(toPercent(rate.rate));
      setNotes(rate.notes ?? "");
      setError(null);
    }
  }, [open, rate]);

  const validateAndAdvance = (): void => {
    const n = Number(rateInput);
    if (!Number.isFinite(n) || n < MIN_RATE_PCT || n > MAX_RATE_PCT) {
      setError(`Rate must be between ${MIN_RATE_PCT}% and ${MAX_RATE_PCT}%`);
      return;
    }
    setError(null);
    setStep("confirm");
  };

  const handleConfirm = (): void => {
    const decimal = Number(rateInput) / 100;
    mutate(
      {
        transactionType: rate.transaction_type as TransactionType,
        body: { rate: decimal, notes: notes.trim() || null },
      },
      { onSuccess: onClose },
    );
  };

  const label = TRANSACTION_TYPE_LABELS[rate.transaction_type as TransactionType];
  const newPct = toPercent(Number(rateInput) / 100);
  const oldPct = toPercent(rate.rate);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        {step === "edit" && (
          <>
            <DialogHeader>
              <DialogTitle>Edit {label} rate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Rate (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min={MIN_RATE_PCT}
                    max={MAX_RATE_PCT}
                    value={rateInput}
                    onChange={(e) => { setRateInput(e.target.value); setError(null); }}
                    className="pr-8"
                    autoFocus
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <p className="text-xs text-muted-foreground">Between 0.1% and 10%</p>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Updated per board decision Q2 2026"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={validateAndAdvance}>Review change</Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm rate change</DialogTitle>
              <DialogDescription>
                You&apos;re about to change the <strong>{label}</strong> rate
                from <strong>{oldPct}%</strong> to <strong>{newPct}%</strong>.
                This will affect future deals only. This action is audit logged.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setStep("edit")} disabled={isPending}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
