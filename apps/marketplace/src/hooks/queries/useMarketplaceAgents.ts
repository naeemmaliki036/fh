import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAgents } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceAgentsParams, MarketplaceAgentsResponse } from "@fh/portal-types";

export function useMarketplaceAgents(
  params: MarketplaceAgentsParams,
): UseQueryResult<MarketplaceAgentsResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.agents(params as Record<string, unknown>),
    queryFn: () => getAgents(marketplaceApi, params),
    staleTime: 2 * 60 * 1000,
  });
}
