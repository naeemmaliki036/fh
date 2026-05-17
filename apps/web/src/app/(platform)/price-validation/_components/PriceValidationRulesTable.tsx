"use client";

import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { PriceValidationRule } from "@/lib/types";

interface Props {
  items: PriceValidationRule[];
  isReordering: boolean;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onToggleEnabled: (rule: PriceValidationRule) => void;
  onEdit: (rule: PriceValidationRule) => void;
  onDelete: (rule: PriceValidationRule) => void;
}

function ScopeChip({ rule }: { rule: PriceValidationRule }): React.ReactElement {
  if (!rule.country) {
    return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Global</span>;
  }
  const parts = [rule.country, rule.city, rule.purpose].filter(Boolean);
  return <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{parts.join(" / ")}</span>;
}

function fmtAmount(amount: string | null): string {
  if (!amount) return "—";
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export function PriceValidationRulesTable({
  items,
  isReordering,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onEdit,
  onDelete,
}: Props): React.ReactElement {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No rules yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
            <th className="w-16 px-3 py-2 text-left">Order</th>
            <th className="px-3 py-2 text-left">Scope</th>
            <th className="w-20 px-3 py-2 text-left">Currency</th>
            <th className="w-32 px-3 py-2 text-right">Min</th>
            <th className="w-32 px-3 py-2 text-right">Max</th>
            <th className="px-3 py-2 text-left">Notes</th>
            <th className="w-24 px-3 py-2 text-left">Enabled</th>
            <th className="w-24 px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((rule, idx) => (
            <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={idx === 0 || isReordering}
                    onClick={() => onMoveUp(idx)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={idx === items.length - 1 || isReordering}
                    onClick={() => onMoveDown(idx)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <span className="ml-1 tabular-nums text-muted-foreground">{idx + 1}</span>
                </div>
              </td>
              <td className="px-3 py-2"><ScopeChip rule={rule} /></td>
              <td className="px-3 py-2 font-mono text-xs">{rule.currency}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtAmount(rule.min_amount)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtAmount(rule.max_amount)}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px] truncate">{rule.notes ?? "—"}</td>
              <td className="px-3 py-2">
                <ToggleSwitch
                  checked={rule.enabled}
                  onCheckedChange={() => onToggleEnabled(rule)}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    className="h-7 w-7"
                    onClick={() => onEdit(rule)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(rule)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
