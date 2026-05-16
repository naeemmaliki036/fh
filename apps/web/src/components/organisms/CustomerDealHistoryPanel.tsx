import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DealStageBadge } from "@/components/atoms/DealStageBadge";
import { DealTypeBadge } from "@/components/atoms/DealTypeBadge";
import type { DealHistoryItem } from "@/lib/types/customer";
import type { DealStage, DealType } from "@/lib/types/deal";

function formatMoney(value: string, currency: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

interface CustomerDealHistoryPanelProps {
  deals: DealHistoryItem[];
}

export function CustomerDealHistoryPanel({ deals }: CustomerDealHistoryPanelProps): React.ReactElement {
  if (deals.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 py-10 text-center">
        <p className="text-sm text-muted-foreground">No deal history yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Property</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">Stage</th>
            <th className="px-3 py-2 text-left font-medium">Value</th>
            <th className="px-3 py-2 text-left font-medium">Closed</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-b last:border-0">
              <td className="px-3 py-2.5 max-w-[200px] truncate" title={deal.property_title ?? undefined}>
                {deal.property_title ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                <DealTypeBadge type={deal.deal_type as DealType} />
              </td>
              <td className="px-3 py-2.5">
                <DealStageBadge stage={deal.stage as DealStage} />
              </td>
              <td className="px-3 py-2.5 font-medium">
                {formatMoney(deal.transaction_value, deal.transaction_currency)}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {deal.closed_at ? new Date(deal.closed_at).toLocaleDateString("en-AE") : "—"}
              </td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/deals/${deal.id}`}
                  className="text-primary hover:underline flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
