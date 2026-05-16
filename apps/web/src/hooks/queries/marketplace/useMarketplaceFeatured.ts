import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceListingItem } from "@/lib/types/marketplace";

export function useMarketplaceFeatured(): UseQueryResult<MarketplaceListingItem[]> {
  return useQuery({
    queryKey: queryKeys.marketplace.featured,
    queryFn: () => marketplaceRepository.getFeatured(),
    staleTime: 5 * 60 * 1000,
  });
}
