"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { priceValidationRepository } from "@/lib/api/repositories";
import type {
  PriceValidationRule,
  PriceValidationRuleListResponse,
  PriceValidationRuleCreateRequest,
  PriceValidationRuleUpdateRequest,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

const LIST_KEY = queryKeys.priceValidation.list;

export function useCreatePriceValidationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PriceValidationRuleCreateRequest): Promise<PriceValidationRule> =>
      priceValidationRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Rule created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePriceValidationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PriceValidationRuleUpdateRequest }): Promise<PriceValidationRule> =>
      priceValidationRepository.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Rule updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePriceValidationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => priceValidationRepository.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Rule deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReorderPriceValidationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]): Promise<void> =>
      priceValidationRepository.reorder(orderedIds),
    onMutate: async (orderedIds: string[]) => {
      await qc.cancelQueries({ queryKey: LIST_KEY });
      const prev = qc.getQueryData<PriceValidationRuleListResponse>(LIST_KEY);
      if (prev) {
        const byId = new Map(prev.items.map((r) => [r.id, r]));
        const reordered = orderedIds
          .map((id, idx) => {
            const r = byId.get(id);
            return r ? { ...r, display_order: idx + 1 } : null;
          })
          .filter((r): r is PriceValidationRule => r !== null);
        qc.setQueryData<PriceValidationRuleListResponse>(LIST_KEY, {
          items: reordered,
          total: prev.total,
        });
      }
      return { prev };
    },
    onError: (e: Error, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(LIST_KEY, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
