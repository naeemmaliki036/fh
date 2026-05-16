"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart2 } from "lucide-react";
import { useClosedDeals } from "@/hooks/queries/useReports";
import { useAgents } from "@/hooks/queries/useAgents";
import { reportsRepository } from "@/lib/api/repositories";
import { ClosedDealsFilters } from "@/components/molecules/ClosedDealsFilters";
import { DealTypeBadge } from "@/components/atoms/DealTypeBadge";
import { EmptyState } from "@/components/molecules/EmptyState";
import { TableSkeleton } from "@/components/molecules/TableSkeleton";
import { Button } from "@/components/ui/button";
import { formatAed } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { useMyTenant } from "@/hooks/queries/useTenants";
import type { ClosedDealsFilterValues } from "@/components/molecules/ClosedDealsFilters";
import type { DealType } from "@/lib/types/deal";

const PAGE_SIZE = 20;

function formatMoney(value: string, currency: string): string {
  try {
    if (currency === "AED") return formatAed(Math.round(Number(value)));
    return `${currency} ${Number(value).toLocaleString()}`;
  } catch {
    return `${currency} ${value}`;
  }
}

export function ClosedDealsReport(): React.ReactElement {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ClosedDealsFilterValues>({
    from_date: "",
    to_date: "",
    agent_id: "",
    deal_type: "",
  });

  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];
  const { data: tenant } = useMyTenant();

  const queryParams = {
    from_date: filters.from_date || undefined,
    to_date: filters.to_date || undefined,
    agent_id: filters.agent_id || undefined,
    deal_type: (filters.deal_type as DealType) || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useClosedDeals(queryParams);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFiltersChange = (next: ClosedDealsFilterValues): void => {
    setFilters(next);
    setPage(1);
  };

  const handleExportCsv = async (): Promise<void> => {
    await reportsRepository.downloadClosedDealsCsv({
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
      agent_id: filters.agent_id || undefined,
      deal_type: (filters.deal_type as DealType) || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <ClosedDealsFilters
        filters={filters}
        agents={agents}
        onFiltersChange={handleFiltersChange}
        onExportCsv={handleExportCsv}
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-3 text-left font-medium">Closed at</th>
              <th className="px-3 py-3 text-left font-medium">Property</th>
              <th className="px-3 py-3 text-left font-medium">Customer</th>
              <th className="px-3 py-3 text-left font-medium">Primary agent</th>
              <th className="px-3 py-3 text-left font-medium">Type</th>
              <th className="px-3 py-3 text-right font-medium">Transaction</th>
              <th className="px-3 py-3 text-right font-medium">Commission paid</th>
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.deal_id}
                  className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => router.push(`/deals/${row.deal_id}`)}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {formatDate(row.closed_at, tenant?.locale)}
                  </td>
                  <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">
                    {row.property_title}
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px] truncate">
                    {row.customer_display_name}
                  </td>
                  <td className="px-3 py-2.5 max-w-[140px] truncate">
                    {row.primary_agent_name}
                  </td>
                  <td className="px-3 py-2.5">
                    <DealTypeBadge type={row.deal_type} />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {formatMoney(row.transaction_value, row.transaction_currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {formatMoney(row.commission_paid_amount, row.transaction_currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={FileBarChart2}
            title="No closed deals"
            description="No closed deals match these filters."
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
