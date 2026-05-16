import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAgencyListings } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceListingsParams, MarketplaceListingsResponse } from "@fh/portal-types";

export function useMarketplaceAgencyListings(
  slug: string,
  params?: Omit<MarketplaceListingsParams, "tenant_slug">,
): UseQueryResult<MarketplaceListingsResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.agencyListings(slug, params as Record<string, unknown>),
    queryFn: () => getAgencyListings(marketplaceApi, slug, params),
    enabled: !!slug,
  });
}
