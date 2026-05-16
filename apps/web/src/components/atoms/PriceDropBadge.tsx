interface PriceDropBadgeProps {
  pct: number | null | undefined;
}

export function PriceDropBadge({ pct }: PriceDropBadgeProps): React.ReactElement | null {
  if (!pct || pct <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
      &darr; {pct.toFixed(1)}%
    </span>
  );
}
