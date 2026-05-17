"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCommissionRateAudit } from "@/hooks/queries/useCommissionRates";
import type { TransactionType } from "@/lib/types";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types";

function toPercent(decimal: number | null): string {
  if (decimal === null || decimal === undefined) return "—";
  return `${(decimal * 100).toFixed(4).replace(/\.?0+$/, "")}%`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface Props {
  transactionType: TransactionType | null;
  open: boolean;
  onClose: () => void;
}

export function CommissionRateAuditDialog({ transactionType, open, onClose }: Props): React.ReactElement {
  const { data, isLoading } = useCommissionRateAudit(
    transactionType ?? "sale",
    open && transactionType !== null,
  );

  const label = transactionType ? TRANSACTION_TYPE_LABELS[transactionType] : "";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{label} — Rate History</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <p className="text-sm text-muted-foreground py-4 text-center">No audit history yet</p>
          )}
          {data?.map((entry) => (
            <div key={entry.id} className="rounded-md border px-4 py-3 text-sm">
              <p className="font-medium">
                {entry.actor_user_email ?? "System"}{" "}
                <span className="font-normal text-muted-foreground">changed rate from</span>{" "}
                <span className="font-mono">{toPercent(entry.before_value)}</span>{" "}
                <span className="text-muted-foreground">to</span>{" "}
                <span className="font-mono">{toPercent(entry.after_value)}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(entry.occurred_at)}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
