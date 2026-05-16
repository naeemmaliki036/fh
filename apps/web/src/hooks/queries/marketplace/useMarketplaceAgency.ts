import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { marketplaceRepository } from "@/lib/api/repositories";
import { queryKeys } from "@/hooks/queryKeys";
import type { MarketplaceAgencyDetail } from "@/lib/types/marketplace";

export function useMarketplaceAgency(slug: string): UseQueryResult<MarketplaceAgencyDetail> {
  return useQuery({
    queryKey: queryKeys.marketplace.agency(slug),
    queryFn: () => marketplaceRepository.getAgency(slug),
    enabled: !!slug,
  });
}
