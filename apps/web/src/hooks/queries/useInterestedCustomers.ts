"use client";

import { useQuery } from "@tanstack/react-query";
import { listingInterestedCustomersRepository } from "@/lib/api/repositories";
import type { ListingInterestedCustomersResponse } from "@/lib/types/customer";
import { queryKeys } from "../queryKeys";

export function useListingInterestedCustomers(listingId: string) {
  return useQuery({
    queryKey: queryKeys.listings.interestedCustomers(listingId),
    queryFn: (): Promise<ListingInterestedCustomersResponse> =>
      listingInterestedCustomersRepository.list(listingId),
    enabled: !!listingId,
  });
}
