import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getCountries } from "@fh/api-client/src/marketplace";
import { marketplaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { MarketplaceCountryItem } from "@fh/portal-types";

export function useMarketplaceCountries(): UseQueryResult<{
  countries: MarketplaceCountryItem[];
}> {
  return useQuery({
    queryKey: queryKeys.marketplace.countries,
    queryFn: () => getCountries(marketplaceApi),
    staleTime: 10 * 60 * 1000,
  });
}
