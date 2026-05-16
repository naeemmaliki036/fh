import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getListings } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceListingsParams, MarketplaceListingsResponse } from "@fh/portal-types";

export function useMarketplaceListings(
  params?: MarketplaceListingsParams,
): UseQueryResult<MarketplaceListingsResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.listings(params as Record<string, unknown>),
    queryFn: () => getListings(marketplaceApi, params),
  });
}
