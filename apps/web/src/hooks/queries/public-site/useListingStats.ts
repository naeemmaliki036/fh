"use client";

import { useQuery } from "@tanstack/react-query";
import { publicSiteRepository } from "@/lib/api/repositories";
import type { ListingStatsResponse } from "@/lib/types/public-site";
import { queryKeys } from "../../queryKeys";

export function useListingStats(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicSite.stats(slug),
    queryFn: (): Promise<ListingStatsResponse> =>
      publicSiteRepository.getListingStats(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}
