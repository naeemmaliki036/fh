"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { DealStageBadge } from "@/components/atoms/DealStageBadge";
import { DealTypeBadge } from "@/components/atoms/DealTypeBadge";
import { useUpdateDeal, useTransitionDeal } from "@/hooks/mutations/useDealMutations";
import { DEAL_STAGE_TRANSITIONS, DEAL_TERMINAL_STAGES } from "@/lib/types/deal";
import { STAGE_LABELS } from "@/lib/constants/deal-labels";
import { Textarea } from "@/components/atoms/Textarea";
import type { Deal, DealStage } from "@/lib/types/deal";

interface DealOverviewPanelProps { deal: Deal; }

export function DealOverviewPanel({ deal }: DealOverviewPanelProps): React.ReactElement {
  const [txValue, setTxValue] = useState(deal.transaction_value);
  const [txValueError, setTxValueError] = useState<string | null>(null);
  const [notes, setNotes] = useState(deal.notes ?? "");
  const [closeAt, setCloseAt] = useState(deal.expected_close_at?.slice(0, 10) ?? "");
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [stageSelectKey, setStageSelectKey] = useState(0);

  const { mutate: update, isPending: updating } = useUpdateDeal(deal.id);
  const { mutate: transition, isPending: transitioning } = useTransitionDeal(deal.id);

  const nextStages = DEAL_STAGE_TRANSITIONS[deal.stage];
  const isTerminal = DEAL_TERMINAL_STAGES.has(deal.stage);

  const handleSave = (): void => {
    const num = Number(txValue);
    if (isNaN(num) || num <= 0) {
      setTxValueError("Transaction value must be a positive number");
      return;
    }
    setTxValueError(null);
    update({ notes: notes || null, expected_close_at: closeAt || null, transaction_value: txValue });
  };

  const doTransition = (stage: DealStage): void => {
    transition({ stage }, { onSuccess: () => { setPendingStage(null); setStageSelectKey(k => k + 1); } });
  };

  return (
    <div className="space-y-6">
      {/* 3-column summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Customer</p>
          <p className="font-medium text-sm">{deal.customer?.full_name ?? "—"}</p>
          {deal.customer?.phone && <p className="text-xs text-muted-foreground">{deal.customer.phone}</p>}
          <Link href={`/customers/${deal.customer_id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-md border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Property</p>
          <p className="font-medium text-sm">{deal.interest_property?.title ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{deal.interest_property?.status}</p>
          <Link href={`/properties/${deal.property_id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-md border p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Agent</p>
          <p className="font-medium text-sm">{deal.primary_agent?.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{deal.primary_agent?.email}</p>
        </div>
      </div>

      {/* Stage */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Stage</Label>
          <DealStageBadge stage={deal.stage} />
          <DealTypeBadge type={deal.deal_type} />
        </div>
        {!isTerminal && nextStages.length > 0 && (
          <Select key={stageSelectKey} onValueChange={v => {
            const s = v as DealStage;
            if (DEAL_TERMINAL_STAGES.has(s)) setPendingStage(s);
            else doTransition(s);
          }}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Move to stage…" /></SelectTrigger>
            <SelectContent>
              {nextStages.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {isTerminal && <p className="text-xs text-muted-foreground">Terminal stage — no further transitions</p>}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Transaction Value ({deal.transaction_currency})</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={txValue}
            onChange={e => { setTxValue(e.target.value); setTxValueError(null); }}
          />
          {txValueError && <p className="text-xs text-destructive">{txValueError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Expected Close</Label>
          <Input type="date" value={closeAt} onChange={e => setCloseAt(e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => {
          setTxValue(deal.transaction_value);
          setNotes(deal.notes ?? "");
          setCloseAt(deal.expected_close_at?.slice(0, 10) ?? "");
        }}>Cancel</Button>
        <Button onClick={handleSave} disabled={updating}>{updating ? "Saving…" : "Save"}</Button>
      </div>

      {/* Terminal confirm dialog */}
      {pendingStage && (
        <Dialog open onOpenChange={() => setPendingStage(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm: {STAGE_LABELS[pendingStage]}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              This is a terminal stage and cannot be undone. Continue?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingStage(null)}>Cancel</Button>
              <Button
                variant={pendingStage === "closed_won" ? "default" : "destructive"}
                disabled={transitioning}
                onClick={() => doTransition(pendingStage)}
              >
                {transitioning ? "Moving…" : `Mark as ${STAGE_LABELS[pendingStage]}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
