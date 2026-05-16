import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceAgenciesResponse } from "@/lib/types/marketplace";

export function useMarketplaceAgencies(
  page?: number,
  pageSize?: number,
  q?: string,
): UseQueryResult<MarketplaceAgenciesResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.agencies(page, pageSize, q),
    queryFn: () => marketplaceRepository.getAgencies(page, pageSize, q),
  });
}
