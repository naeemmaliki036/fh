"use client";

import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { MarketplaceCountry } from "@/lib/types";

interface Props {
  items: MarketplaceCountry[];
  isReordering: boolean;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onToggleEnabled: (country: MarketplaceCountry) => void;
  onEdit: (country: MarketplaceCountry) => void;
  onDelete: (country: MarketplaceCountry) => void;
}

export function CountriesTable({
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
        No countries yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
            <th className="w-16 px-3 py-2 text-left">Order</th>
            <th className="w-12 px-3 py-2 text-left">Flag</th>
            <th className="w-20 px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="w-24 px-3 py-2 text-left">Enabled</th>
            <th className="w-24 px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((country, idx) => (
            <tr key={country.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
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
              <td className="px-3 py-2 text-lg">{country.flag_emoji}</td>
              <td className="px-3 py-2 font-mono font-medium">{country.code}</td>
              <td className="px-3 py-2">{country.name}</td>
              <td className="px-3 py-2">
                <ToggleSwitch
                  checked={country.enabled}
                  onCheckedChange={() => onToggleEnabled(country)}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    className="h-7 w-7"
                    onClick={() => onEdit(country)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(country)}
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
