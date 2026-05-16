"use client";

import { useQuery } from "@tanstack/react-query";
import { openHouseRepository } from "@/lib/api/repositories";
import type { OpenHouseListResponse } from "@/lib/types/open-house";
import { queryKeys } from "../queryKeys";

export function useOpenHouses(listingId: string, includePast = false) {
  return useQuery({
    queryKey: queryKeys.openHouses.list(listingId, includePast),
    queryFn: (): Promise<OpenHouseListResponse> =>
      openHouseRepository.list(listingId, { include_past: includePast }),
    enabled: !!listingId,
    staleTime: 30_000,
  });
}
