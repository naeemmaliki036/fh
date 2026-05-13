"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listingPriceRepository } from "@/lib/api/repositories";
import type { ListingPriceChangeRequest, ListingHeroMediaRequest } from "@/lib/types/listing-price";
import type { Listing } from "@/lib/types/listing";
import { queryKeys } from "../queryKeys";

export function useChangeListingPrice(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ListingPriceChangeRequest): Promise<Listing> =>
      listingPriceRepository.changePrice(listingId, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(listingId), data);
      qc.invalidateQueries({ queryKey: queryKeys.listings.priceHistory(listingId) });
      toast.success("Price updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useSetListingHeroMedia(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ListingHeroMediaRequest): Promise<Listing> =>
      listingPriceRepository.setHeroMedia(listingId, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(listingId), data);
      toast.success("Hero media updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
