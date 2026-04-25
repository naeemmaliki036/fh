import { Badge } from "@/components/ui/badge";

interface LicenseExpiryBadgeProps {
  expiryDate: string | null;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getDaysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function LicenseExpiryBadge({ expiryDate }: LicenseExpiryBadgeProps): React.ReactElement {
  if (!expiryDate) return <span className="text-xs text-muted-foreground">—</span>;

  const days = getDaysUntilExpiry(expiryDate);
  const isExpired = days < 0;
  const isSoonExpiring = days >= 0 && days <= 30;
  const formatted = new Date(expiryDate).toLocaleDateString("en-AE", {
    year: "numeric", month: "short", day: "numeric",
  });

  if (isExpired) {
    return <Badge variant="destructive">Expired ({formatted})</Badge>;
  }
  if (isSoonExpiring) {
    return <Badge variant="warning">Expires {formatted}</Badge>;
  }
  return <Badge variant="outline">{formatted}</Badge>;
}

export function isExpiringWithin30Days(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const ms = new Date(dateStr).getTime() - Date.now();
  return ms >= 0 && ms <= THIRTY_DAYS_MS;
}
