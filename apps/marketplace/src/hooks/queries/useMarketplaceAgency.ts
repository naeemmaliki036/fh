import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getAgency } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceAgencyDetail } from "@fh/portal-types";

export function useMarketplaceAgency(slug: string): UseQueryResult<MarketplaceAgencyDetail> {
  return useQuery({
    queryKey: queryKeys.marketplace.agency(slug),
    queryFn: () => getAgency(marketplaceApi, slug),
    enabled: !!slug,
  });
}
