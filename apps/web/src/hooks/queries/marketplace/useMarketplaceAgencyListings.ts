import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceListingsParams, MarketplaceListingsResponse } from "@/lib/types/marketplace";

export function useMarketplaceAgencyListings(
  slug: string,
  params?: Omit<MarketplaceListingsParams, "tenant_slug">,
): UseQueryResult<MarketplaceListingsResponse> {
  return useQuery({
    queryKey: queryKeys.marketplace.agencyListings(slug, params as Record<string, unknown>),
    queryFn: () => marketplaceRepository.getAgencyListings(slug, params),
    enabled: !!slug,
  });
}
