export function formatCommission(value: number | string, type: "percentage" | "fixed", currency = "AED"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (type === "percentage") return `${n.toFixed(2)}%`;
  return `${currency} ${n.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
