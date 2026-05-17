import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getMyListings } from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useConsumer } from "@/lib/consumer-context";
import type { ConsumerListingsResponse } from "@fh/portal-types";

export function useMyListings(page = 1): UseQueryResult<ConsumerListingsResponse> {
  const { token } = useConsumer();
  return useQuery({
    queryKey: queryKeys.consumer.myListings(page),
    queryFn: () => getMyListings(marketplaceAuthedApi, page, 20),
    enabled: !!token,
    staleTime: 30_000,
  });
}
