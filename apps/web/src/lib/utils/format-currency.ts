const aedFormatter = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

export function formatAed(amount: number): string {
  return aedFormatter.format(amount);
}
