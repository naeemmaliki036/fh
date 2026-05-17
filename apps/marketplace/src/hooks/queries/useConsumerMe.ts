import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getConsumerMe } from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useConsumer } from "@/lib/consumer-context";
import type { ConsumerResponse } from "@fh/portal-types";

export function useConsumerMe(): UseQueryResult<ConsumerResponse> {
  const { token } = useConsumer();
  return useQuery({
    queryKey: queryKeys.consumer.me,
    queryFn: () => getConsumerMe(marketplaceAuthedApi),
    enabled: !!token,
    staleTime: 60_000,
  });
}
