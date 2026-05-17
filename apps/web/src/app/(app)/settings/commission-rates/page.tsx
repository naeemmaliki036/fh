"use client";

import { useState } from "react";
import { Pencil, History } from "lucide-react";
import { useCommissionRates } from "@/hooks/queries/useCommissionRates";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import type { TenantCommissionRate, TransactionType } from "@/lib/types";
import { TRANSACTION_TYPE_LABELS } from "@/lib/types";
import { CommissionRateEditDialog } from "./CommissionRateEditDialog";
import { CommissionRateAuditDialog } from "./CommissionRateAuditDialog";

const EDIT_ROLES = new Set(["company_owner", "company_admin", "finance_user"]);
const ORDERED_TYPES: TransactionType[] = ["sale", "rent_long", "rent_short", "off_plan"];

function toPercent(decimal: number): string {
  return `${(decimal * 100).toFixed(4).replace(/\.?0+$/, "")}%`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

interface RateRowProps {
  rate: TenantCommissionRate;
  canEdit: boolean;
  onEdit: (r: TenantCommissionRate) => void;
  onHistory: (t: TransactionType) => void;
}

function RateRow({ rate, canEdit, onEdit, onHistory }: RateRowProps): React.ReactElement {
  return (
    <div className="grid grid-cols-[160px_80px_1fr_180px_100px_auto] items-center gap-4 px-4 py-3">
      <span className="text-sm font-medium">
        {TRANSACTION_TYPE_LABELS[rate.transaction_type as TransactionType]}
      </span>
      <span className="font-mono text-sm">{toPercent(rate.rate)}</span>
      <span className="text-sm text-muted-foreground truncate">{rate.notes ?? "—"}</span>
      <span className="text-sm text-muted-foreground truncate">
        {rate.updated_by_user_email ?? "—"}
      </span>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(rate.updated_at)}
      </span>
      <div className="flex items-center gap-1">
        {canEdit && (
          <Button size="icon" variant="ghost" onClick={() => onEdit(rate)} title="Edit rate">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onHistory(rate.transaction_type as TransactionType)}
          title="View history"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function CommissionRatesPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const { data: rates, isLoading } = useCommissionRates();
  const [editing, setEditing] = useState<TenantCommissionRate | null>(null);
  const [auditType, setAuditType] = useState<TransactionType | null>(null);

  const canEdit = !!currentUser && EDIT_ROLES.has(currentUser.role);

  const orderedRates = ORDERED_TYPES.flatMap((t) =>
    rates?.filter((r) => r.transaction_type === t) ?? [],
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Commission Rates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Default company-earned commission rates per transaction type. These rates feed the New
          Agent form&apos;s live calculator and deal-creation defaults.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {!isLoading && (
        <div className="rounded-md border">
          {/* Header */}
          <div className="grid grid-cols-[160px_80px_1fr_180px_100px_auto] items-center gap-4 border-b bg-muted/40 px-4 py-2">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Transaction type
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Rate
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Notes
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Updated by
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Updated at
            </span>
            <span />
          </div>

          {orderedRates.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              No commission rates found
            </p>
          )}

          <div className="divide-y">
            {orderedRates.map((rate) => (
              <RateRow
                key={rate.id}
                rate={rate}
                canEdit={canEdit}
                onEdit={setEditing}
                onHistory={(t) => setAuditType(t)}
              />
            ))}
          </div>
        </div>
      )}

      {editing && (
        <CommissionRateEditDialog
          rate={editing}
          open
          onClose={() => setEditing(null)}
        />
      )}

      <CommissionRateAuditDialog
        transactionType={auditType}
        open={auditType !== null}
        onClose={() => setAuditType(null)}
      />
    </div>
  );
}
