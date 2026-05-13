import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ListingPriceHistoryEntry } from "@/lib/types/listing-price";

interface PriceChangeBadgeProps {
  history: ListingPriceHistoryEntry[];
  className?: string;
}

export function PriceChangeBadge({ history, className }: PriceChangeBadgeProps): React.ReactElement | null {
  if (history.length < 1) return null;

  // Most recent entry
  const latest = history[history.length - 1];
  if (!latest.old_price) return null;

  const oldVal = parseFloat(latest.old_price);
  const newVal = parseFloat(latest.new_price);
  if (!oldVal || isNaN(oldVal) || isNaN(newVal)) return null;

  const pct = ((newVal - oldVal) / oldVal) * 100;
  const isUp = pct > 0;
  const abs = Math.abs(pct).toFixed(2);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
        isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
        className,
      )}
      title={`Last changed: ${new Date(latest.created_at).toLocaleDateString()} by ${latest.changed_by_name ?? "Unknown"}`}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : "-"}{abs}%
    </span>
  );
}
