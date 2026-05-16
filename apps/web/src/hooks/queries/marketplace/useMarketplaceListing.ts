import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceListingDetail } from "@/lib/types/marketplace";

export function useMarketplaceListing(
  listingId: string,
): UseQueryResult<MarketplaceListingDetail> {
  return useQuery({
    queryKey: queryKeys.marketplace.listing(listingId),
    queryFn: () => marketplaceRepository.getListing(listingId),
    enabled: !!listingId,
  });
}
