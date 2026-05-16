import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getStats } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceStats } from "@fh/portal-types";

export function useMarketplaceStats(): UseQueryResult<MarketplaceStats> {
  return useQuery({
    queryKey: queryKeys.marketplace.stats,
    queryFn: () => getStats(marketplaceApi),
    staleTime: 5 * 60 * 1000,
  });
}
