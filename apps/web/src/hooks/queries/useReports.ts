"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsRepository } from "@/lib/api/repositories";
import type { ClosedDealsParams, ClosedDealsResponse } from "@/lib/types/deal";
import { queryKeys } from "../queryKeys";

export function useClosedDeals(params?: ClosedDealsParams) {
  return useQuery({
    queryKey: queryKeys.reports.closedDeals(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<ClosedDealsResponse> => reportsRepository.getClosedDeals(params),
    placeholderData: (prev) => prev,
  });
}
