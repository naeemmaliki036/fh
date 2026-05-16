import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceStats } from "@/lib/types/marketplace";

export function useMarketplaceStats(): UseQueryResult<MarketplaceStats> {
  return useQuery({
    queryKey: queryKeys.marketplace.stats,
    queryFn: () => marketplaceRepository.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}
