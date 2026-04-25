"use client";

import { useQuery } from "@tanstack/react-query";
import { dealRepository } from "@/lib/api/repositories";
import type { Deal, DealListResponse, DealListParams } from "@/lib/types/deal";
import { queryKeys } from "../queryKeys";

export function useDeals(params?: DealListParams) {
  return useQuery({
    queryKey: queryKeys.deals.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<DealListResponse> => dealRepository.listDeals(params),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: queryKeys.deals.detail(id),
    queryFn: (): Promise<Deal> => dealRepository.getById(id),
    enabled: !!id,
  });
}
