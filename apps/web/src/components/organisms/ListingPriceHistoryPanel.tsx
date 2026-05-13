"use client";

import { type ReactElement } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useListingPriceHistory } from "@/hooks/queries/useListingPrice";
import { formatDate } from "@/lib/utils/format-date";
import type { ListingPriceHistoryEntry } from "@/lib/types/listing-price";

function pctChange(oldVal: string | null, newVal: string): number | null {
  if (!oldVal) return null;
  const o = parseFloat(oldVal);
  const n = parseFloat(newVal);
  if (!o || isNaN(o) || isNaN(n)) return null;
  return ((n - o) / o) * 100;
}

function PctBadge({ pct }: { pct: number | null }): ReactElement {
  if (pct === null) return <Badge variant="secondary" className="text-xs">First price</Badge>;
  const abs = Math.abs(pct).toFixed(2);
  if (pct > 0)
    return (
      <Badge variant="secondary" className="text-xs gap-1 text-green-700 bg-green-50">
        <TrendingUp className="h-3 w-3" />+{abs}%
      </Badge>
    );
  if (pct < 0)
    return (
      <Badge variant="secondary" className="text-xs gap-1 text-red-700 bg-red-50">
        <TrendingDown className="h-3 w-3" />-{abs}%
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <Minus className="h-3 w-3" />0%
    </Badge>
  );
}

function HistoryRow({ entry }: { entry: ListingPriceHistoryEntry }): ReactElement {
  const pct = pctChange(entry.old_price, entry.new_price);
  return (
    <div className="flex flex-wrap items-start gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          {entry.old_price && (
            <span className="text-sm text-muted-foreground line-through">
              {entry.currency} {parseFloat(entry.old_price).toLocaleString()}
            </span>
          )}
          <span className="text-sm font-medium">
            {entry.currency} {parseFloat(entry.new_price).toLocaleString()}
          </span>
          <PctBadge pct={pct} />
        </div>
        {entry.reason_note && (
          <p className="text-xs text-muted-foreground">{entry.reason_note}</p>
        )}
      </div>
      <div className="text-right text-xs text-muted-foreground shrink-0">
        <p>{entry.changed_by_name ?? "Unknown"}</p>
        <p>{formatDate(entry.created_at, "en")}</p>
      </div>
    </div>
  );
}

interface ListingPriceHistoryPanelProps {
  listingId: string;
}

export function ListingPriceHistoryPanel({ listingId }: ListingPriceHistoryPanelProps): ReactElement {
  const { data, isLoading, error } = useListingPriceHistory(listingId);
  const entries = [...(data?.items ?? [])].reverse();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading price history...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load price history.</p>;

  if (entries.length === 0) {
    return (
      <div className="py-8 border rounded-md bg-muted/20 text-center text-muted-foreground">
        <p className="text-sm">No price changes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border px-4 divide-y divide-border">
      {entries.map((e) => <HistoryRow key={e.id} entry={e} />)}
    </div>
  );
}
