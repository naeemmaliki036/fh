import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAgencies } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceAgenciesResponse } from "@fh/portal-types";

export function useMarketplaceAgencies(
  page?: number,
  pageSize?: number,
  q?: string,
): UseQueryResult<MarketplaceAgenciesResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.agencies(page, pageSize, q),
    queryFn: () => getAgencies(marketplaceApi, page, pageSize, q),
  });
}
