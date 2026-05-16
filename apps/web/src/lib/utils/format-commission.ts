/** Format commission for display.
 *  - Percentage: max 2 decimals, trailing zeros stripped (2 not 2.00, 2.5 not 2.50).
 *  - Fixed: whole-money amount (no decimals) — same rule as price display.
 */
export function formatCommission(value: number | string, type: "percentage" | "fixed", currency = "AED"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  if (type === "percentage") {
    const s = n.toFixed(2).replace(/\.?0+$/, "");
    return `${s || "0"}%`;
  }
  return `${currency} ${n.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}
