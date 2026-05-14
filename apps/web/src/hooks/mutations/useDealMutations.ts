"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { dealRepository } from "@/lib/api/repositories";
import type {
  Deal,
  DealCreateRequest,
  DealUpdateRequest,
  DealTransitionRequest,
  DealCommissionOverrideRequest,
  DealCommissionPayoutRequest,
} from "@/lib/types/deal";
import { queryKeys } from "../queryKeys";

export function useCreateDeal() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: DealCreateRequest): Promise<Deal> => dealRepository.create(data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      toast.success("Deal created");
      router.push(`/deals/${data.id}`);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DealUpdateRequest): Promise<Deal> => dealRepository.update(id, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      toast.success("Deal updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useTransitionDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DealTransitionRequest): Promise<Deal> => dealRepository.transition(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      qc.invalidateQueries({ queryKey: queryKeys.deals.all });
      toast.success(`Stage → ${data.stage.replace(/_/g, " ")}`);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useOverrideCommission(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DealCommissionOverrideRequest): Promise<Deal> =>
      dealRepository.overrideCommission(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      toast.success("Commission overridden");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function usePayoutCommission(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DealCommissionPayoutRequest): Promise<Deal> =>
      dealRepository.payoutCommission(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      toast.success("Payout recorded");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useCancelCommissionPayout(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason_note: string): Promise<Deal> =>
      dealRepository.cancelCommissionPayout(id, reason_note),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      toast.success("Payout canceled");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useAdminConfirmDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<Deal> => dealRepository.adminConfirm(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      toast.success("Deal confirmed — agent can now acknowledge");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useAgentConfirmDeal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<Deal> => dealRepository.agentConfirm(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deals.detail(id), data);
      toast.success("Commission acknowledged — deal is ready for payout");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
