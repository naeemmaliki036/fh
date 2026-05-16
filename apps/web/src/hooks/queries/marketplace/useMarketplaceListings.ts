import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceListingsParams, MarketplaceListingsResponse } from "@/lib/types/marketplace";

export function useMarketplaceListings(
  params?: MarketplaceListingsParams,
): UseQueryResult<MarketplaceListingsResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.listings(params as Record<string, unknown>),
    queryFn: () => marketplaceRepository.getListings(params),
  });
}
