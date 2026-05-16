import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getListing } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceListingDetail } from "@fh/portal-types";

export function useMarketplaceListing(
  listingId: string,
): UseQueryResult<MarketplaceListingDetail> {
  return useQuery({
    queryKey: queryKeys.marketplace.listing(listingId),
    queryFn: () => getListing(marketplaceApi, listingId),
    enabled: !!listingId,
  });
}
