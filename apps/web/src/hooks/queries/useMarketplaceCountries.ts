"use client";

import { useQuery } from "@tanstack/react-query";
import { marketplaceCountryRepository } from "@/lib/api/repositories";
import type { MarketplaceCountryListResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useMarketplaceCountries() {
  return useQuery({
    queryKey: queryKeys.marketplaceCountries.list,
    queryFn: (): Promise<MarketplaceCountryListResponse> =>
      marketplaceCountryRepository.list(),
  });
}
