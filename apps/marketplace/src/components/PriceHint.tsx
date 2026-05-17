"use client";

interface PriceHintProps {
  value: number | string | null | undefined;
  currency?: string | null;
}

function toWords(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)} billion`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)} million`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)} thousand`;
  return n.toString();
}

export function PriceHint({ value, currency }: PriceHintProps): React.ReactElement | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const formatted = n.toLocaleString("en-AE", { maximumFractionDigits: 0 });
  return (
    <p className="text-[11px] text-slate-500 mt-1">
      {currency ? `${currency} ` : ""}{formatted} <span className="text-slate-400">— {toWords(n)}</span>
    </p>
  );
}
