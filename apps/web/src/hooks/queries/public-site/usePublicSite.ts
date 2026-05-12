"use client";

import { useQuery } from "@tanstack/react-query";
import { publicSiteRepository } from "@/lib/api/repositories";
import type { PublicTenantProfile, PublicListingListResponse, PublicListingsParams } from "@/lib/types/public-site";
import { queryKeys } from "../../queryKeys";

export function usePublicSiteProfile(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicSite.profile(slug),
    queryFn: (): Promise<PublicTenantProfile> =>
      publicSiteRepository.getProfile(slug),
    enabled: !!slug,
    retry: false,
    staleTime: 60_000,
  });
}

export function usePublicSiteListings(slug: string, params: PublicListingsParams = {}) {
  return useQuery({
    queryKey: queryKeys.publicSite.listings(slug, params as Record<string, unknown>),
    queryFn: (): Promise<PublicListingListResponse> =>
      publicSiteRepository.getListings(slug, params),
    enabled: !!slug,
    staleTime: 30_000,
  });
}
