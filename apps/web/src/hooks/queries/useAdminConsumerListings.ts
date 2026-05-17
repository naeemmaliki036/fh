"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { adminConsumerListingsRepository } from "@/lib/api/repositories";
import { queryKeys } from "../queryKeys";
import type {
  AdminConsumerListingDetail,
  AdminConsumerListingQueueParams,
  AdminConsumerListingQueueResponse,
} from "@/lib/types";

export function useAdminConsumerListings(
  params?: AdminConsumerListingQueueParams,
): UseQueryResult<AdminConsumerListingQueueResponse> {
  return useQuery({
    queryKey: queryKeys.consumerListings.queue(params as Record<string, unknown>),
    queryFn: (): Promise<AdminConsumerListingQueueResponse> =>
      adminConsumerListingsRepository.list(params),
  });
}

export function useAdminConsumerListingDetail(
  id: string,
): UseQueryResult<AdminConsumerListingDetail> {
  return useQuery({
    queryKey: queryKeys.consumerListings.detail(id),
    queryFn: (): Promise<AdminConsumerListingDetail> =>
      adminConsumerListingsRepository.getDetail(id),
    enabled: !!id,
  });
}

// Lightweight query used by the sidebar badge — fetches only page_size=1 for total
export function useConsumerListingsPendingCount(): UseQueryResult<{ total: number }> {
  return useQuery({
    queryKey: queryKeys.consumerListings.pendingCount,
    queryFn: async (): Promise<{ total: number }> => {
      const res = await adminConsumerListingsRepository.list({
        status: "pending_review",
        page: 1,
        page_size: 1,
      });
      return { total: res.total };
    },
    staleTime: 60_000,
  });
}
