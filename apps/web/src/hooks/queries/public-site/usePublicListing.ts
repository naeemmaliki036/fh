"use client";

import { useQuery } from "@tanstack/react-query";
import { publicSiteRepository } from "@/lib/api/repositories";
import type { PublicListingDetail } from "@/lib/types/public-site";
import { queryKeys } from "../../queryKeys";

export function usePublicListing(slug: string, listingId: string) {
  return useQuery({
    queryKey: queryKeys.publicSite.listing(slug, listingId),
    queryFn: (): Promise<PublicListingDetail> =>
      publicSiteRepository.getListing(slug, listingId),
    enabled: !!slug && !!listingId,
    retry: false,
    staleTime: 60_000,
  });
}
