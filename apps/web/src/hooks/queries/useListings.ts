"use client";

import { useQuery } from "@tanstack/react-query";
import { listingRepository } from "@/lib/api/repositories";
import type { Listing, ListingListResponse, ListingListParams } from "@/lib/types/listing";
import { queryKeys } from "../queryKeys";

export function useListings(params?: ListingListParams) {
  return useQuery({
    queryKey: queryKeys.listings.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<ListingListResponse> => listingRepository.listListings(params),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: (): Promise<Listing> => listingRepository.getById(id),
    enabled: !!id,
  });
}
