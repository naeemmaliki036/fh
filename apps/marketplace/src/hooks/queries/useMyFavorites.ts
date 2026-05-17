import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getMyFavorites } from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useConsumer } from "@/lib/consumer-context";
import type { MarketplaceListingsResponse } from "@fh/portal-types";

export function useMyFavorites(page = 1): UseQueryResult<MarketplaceListingsResponse> {
  const { token } = useConsumer();
  return useQuery({
    queryKey: queryKeys.consumer.myFavorites(page),
    queryFn: () => getMyFavorites(marketplaceAuthedApi, page, 20),
    enabled: !!token,
    staleTime: 30_000,
  });
}
