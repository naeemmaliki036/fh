"use client";

import { useQuery } from "@tanstack/react-query";
import { listingRepository } from "@/lib/api/repositories";
import type { Listing } from "@/lib/types/listing";
import { queryKeys } from "../queryKeys";

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: (): Promise<Listing> => listingRepository.getById(id),
    enabled: !!id,
  });
}
