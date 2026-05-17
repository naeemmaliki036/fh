"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminConsumerListingsRepository } from "@/lib/api/repositories";
import { queryKeys } from "../queryKeys";
import type { ModerationActionResponse, RequestChangesBody } from "@/lib/types";

function invalidate(qc: ReturnType<typeof useQueryClient>, id: string): void {
  void qc.invalidateQueries({ queryKey: queryKeys.consumerListings.detail(id) });
  void qc.invalidateQueries({ queryKey: ["consumer-listings", "queue"] });
  void qc.invalidateQueries({ queryKey: queryKeys.consumerListings.pendingCount });
}

export function useApproveConsumerListing(): UseMutationResult<
  ModerationActionResponse,
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<ModerationActionResponse> =>
      adminConsumerListingsRepository.approve(id),
    onSuccess: (_, id) => {
      invalidate(qc, id);
      toast.success("Listing approved — owner notified by email");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRequestListingChanges(): UseMutationResult<
  ModerationActionResponse,
  Error,
  { id: string; body: RequestChangesBody }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }): Promise<ModerationActionResponse> =>
      adminConsumerListingsRepository.requestChanges(id, body),
    onSuccess: (_, { id }) => {
      invalidate(qc, id);
      toast.success("Changes requested — owner notified by email");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
