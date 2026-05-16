"use client";

import { useQuery } from "@tanstack/react-query";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import type { PublicListingCard } from "@/lib/types/public-site";
import { queryKeys } from "../queryKeys";

export function useSimilarListings(slug: string, listingId: string, limit: number = 4) {
  return useQuery<PublicListingCard[]>({
    queryKey: queryKeys.publicSite.similar(slug, listingId),
    queryFn: (): Promise<PublicListingCard[]> =>
      publicSiteRepository.getSimilarListings(slug, listingId, limit),
    enabled: !!slug && !!listingId,
    staleTime: 120_000,
  });
}
