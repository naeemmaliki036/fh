"use client";

import { useQuery } from "@tanstack/react-query";
import { listingPriceRepository } from "@/lib/api/repositories";
import type { ListingPriceHistoryResponse } from "@/lib/types/listing-price";
import { queryKeys } from "../queryKeys";

export function useListingPriceHistory(listingId: string) {
  return useQuery({
    queryKey: queryKeys.listings.priceHistory(listingId),
    queryFn: (): Promise<ListingPriceHistoryResponse> =>
      listingPriceRepository.getHistory(listingId),
    enabled: !!listingId,
  });
}
