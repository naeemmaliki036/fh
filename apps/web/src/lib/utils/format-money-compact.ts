export function formatMoneyCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `AED ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `AED ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `AED ${(amount / 1_000).toFixed(1)}K`;
  }
  return `AED ${amount.toLocaleString()}`;
}
