"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PayoutStatusBadge } from "@/components/atoms/PayoutStatusBadge";
import { CommissionForm } from "@/components/molecules/CommissionForm";
import { PayoutForm } from "@/components/molecules/PayoutForm";
import {
  useOverrideCommission,
  usePayoutCommission,
  useCancelCommissionPayout,
} from "@/hooks/mutations/useDealMutations";
import { DEAL_TERMINAL_STAGES } from "@/lib/types/deal";
import type { Deal, DealCommissionOverrideRequest, DealCommissionPayoutRequest } from "@/lib/types/deal";

function fmt(v: string, cur: string): string {
  try { return new Intl.NumberFormat("en-AE", { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(Number(v)); }
  catch { return `${cur} ${v}`; }
}

interface DealCommissionPanelProps { deal: Deal; }

export function DealCommissionPanel({ deal }: DealCommissionPanelProps): React.ReactElement {
  const [showOverride, setShowOverride] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { mutate: override, isPending: overriding } = useOverrideCommission(deal.id);
  const { mutate: payout, isPending: payingOut } = usePayoutCommission(deal.id);
  const { mutate: cancelPayout, isPending: canceling } = useCancelCommissionPayout(deal.id);

  const cur = deal.transaction_currency;
  const isTerminal = DEAL_TERMINAL_STAGES.has(deal.stage);
  const remaining = String(Math.max(0, Number(deal.commission_amount) - Number(deal.commission_paid_amount)));

  const handleOverride = (data: DealCommissionOverrideRequest): void => {
    override(data, { onSuccess: () => setShowOverride(false) });
  };
  const handlePayout = (data: DealCommissionPayoutRequest): void => {
    payout(data, { onSuccess: () => setShowPayout(false) });
  };

  return (
    <div className="space-y-6">
      {/* Big number */}
      <div className="rounded-xl border p-6 text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Commission</p>
        <p className="text-4xl font-bold">{fmt(deal.commission_amount, cur)}</p>
        {deal.commission_overridden && (
          <span className="inline-block text-xs bg-amber-100 text-amber-800 rounded px-2 py-0.5">Overridden</span>
        )}
      </div>

      {/* Commission breakdown */}
      <div className="rounded-md border p-4 space-y-3">
        <p className="text-sm font-medium">Commission Details</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Type</span>
          <span className="capitalize">{deal.commission_type}</span>
          <span className="text-muted-foreground">Value</span>
          <span>{deal.commission_value}{deal.commission_type === "percentage" ? "%" : ` ${cur}`}</span>
          <span className="text-muted-foreground">Overridden</span>
          <span>{deal.commission_overridden ? "Yes" : "No"}</span>
          {deal.commission_override_reason && (
            <>
              <span className="text-muted-foreground">Reason</span>
              <span>{deal.commission_override_reason}</span>
            </>
          )}
        </div>
      </div>

      {/* Payout */}
      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Payout</p>
          <PayoutStatusBadge status={deal.commission_payout_status} />
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Paid</span>
          <span>{fmt(deal.commission_paid_amount, cur)}</span>
          <span className="text-muted-foreground">Remaining</span>
          <span>{fmt(remaining, cur)}</span>
          {deal.commission_paid_at && (
            <>
              <span className="text-muted-foreground">Last paid</span>
              <span>{new Date(deal.commission_paid_at).toLocaleDateString("en-AE")}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={isTerminal}
          onClick={() => setShowOverride(true)}
          title={isTerminal ? "Cannot override commission after deal is closed" : undefined}
        >
          Override Commission
        </Button>
        {deal.commission_payout_status !== "paid" && deal.commission_payout_status !== "canceled" && (
          <Button variant="default" onClick={() => setShowPayout(true)}>
            Record Payout
          </Button>
        )}
        {deal.commission_payout_status !== "canceled" && deal.commission_payout_status !== "pending" && (
          <Button variant="destructive" onClick={() => setShowCancelConfirm(true)}>
            Cancel Payout
          </Button>
        )}
      </div>

      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent>
          <DialogHeader><DialogTitle>Override Commission</DialogTitle></DialogHeader>
          <CommissionForm isPending={overriding} onSubmit={handleOverride} onCancel={() => setShowOverride(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showPayout} onOpenChange={setShowPayout}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payout</DialogTitle></DialogHeader>
          <PayoutForm remaining={remaining} currency={cur} isPending={payingOut} onSubmit={handlePayout} onCancel={() => setShowPayout(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel Payout?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will mark the payout as canceled. Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Keep</Button>
            <Button variant="destructive" disabled={canceling} onClick={() => { cancelPayout(); setShowCancelConfirm(false); }}>
              {canceling ? "Canceling…" : "Cancel payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
