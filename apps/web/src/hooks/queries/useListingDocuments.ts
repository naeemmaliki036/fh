"use client";

import { useQuery } from "@tanstack/react-query";
import { listingDocumentRepository } from "@/lib/api/repositories";
import type { ListingDocumentListResponse } from "@/lib/types/listing-document";
import { queryKeys } from "../queryKeys";

export function useListingDocuments(listingId: string) {
  return useQuery({
    queryKey: queryKeys.listings.documents(listingId),
    queryFn: (): Promise<ListingDocumentListResponse> =>
      listingDocumentRepository.list(listingId),
    enabled: !!listingId,
  });
}
