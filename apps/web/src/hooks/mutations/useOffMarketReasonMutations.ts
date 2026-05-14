"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { offMarketReasonRepository } from "@/lib/api/repositories";
import type { OffMarketReason, OffMarketReasonCreateRequest, OffMarketReasonUpdateRequest } from "@/lib/types/off-market-reason";
import { queryKeys } from "../queryKeys";

export function useCreateOffMarketReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OffMarketReasonCreateRequest): Promise<OffMarketReason> =>
      offMarketReasonRepository.createReason(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offMarketReasons.all });
      toast.success("Reason added");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateOffMarketReason(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OffMarketReasonUpdateRequest): Promise<OffMarketReason> =>
      offMarketReasonRepository.updateReason(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offMarketReasons.all });
      toast.success("Reason updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteOffMarketReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> =>
      offMarketReasonRepository.deleteReason(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.offMarketReasons.all });
      toast.success("Reason deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
