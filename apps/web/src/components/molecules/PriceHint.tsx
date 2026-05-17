"use client";

interface PriceHintProps {
  /** Raw string from the input (digits-only after our onInput strip). */
  value: string | undefined | null;
  /** Optional currency prefix shown before the formatted number. */
  currency?: string;
}

function toWords(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)} billion`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)} million`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)} thousand`;
  return n.toString();
}

/**
 * Renders below a price input: comma-formatted number + spoken approximation.
 * Hidden when value is empty or not a number.
 */
export function PriceHint({ value, currency }: PriceHintProps): React.ReactElement | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const formatted = n.toLocaleString("en-AE", { maximumFractionDigits: 0 });
  const words = toWords(n);
  return (
    <p className="text-xs text-muted-foreground mt-1">
      {currency ? `${currency} ` : ""}{formatted} <span className="text-muted-foreground/70">— {words}</span>
    </p>
  );
}
