import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getFeatured } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceListingItem } from "@fh/portal-types";

export function useMarketplaceFeatured(): UseQueryResult<MarketplaceListingItem[]> {
  return useQuery({
    queryKey: queryKeys.marketplace.featured,
    queryFn: () => getFeatured(marketplaceApi),
    staleTime: 5 * 60 * 1000,
  });
}
