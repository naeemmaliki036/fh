"use client";

import { useQuery } from "@tanstack/react-query";
import { offMarketReasonRepository } from "@/lib/api/repositories";
import type { OffMarketReason } from "@/lib/types/off-market-reason";
import { queryKeys } from "../queryKeys";

export function useOffMarketReasons() {
  return useQuery({
    queryKey: queryKeys.offMarketReasons.all,
    queryFn: (): Promise<OffMarketReason[]> => offMarketReasonRepository.listAll(),
  });
}
