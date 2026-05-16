"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { marketplaceCountryRepository } from "@/lib/api/repositories";
import type {
  MarketplaceCountry,
  MarketplaceCountryCreateRequest,
  MarketplaceCountryUpdateRequest,
  MarketplaceCountryListResponse,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

const LIST_KEY = queryKeys.marketplaceCountries.list;

export function useCreateMarketplaceCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MarketplaceCountryCreateRequest): Promise<MarketplaceCountry> =>
      marketplaceCountryRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Country added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMarketplaceCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketplaceCountryUpdateRequest }): Promise<MarketplaceCountry> =>
      marketplaceCountryRepository.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Country updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMarketplaceCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => marketplaceCountryRepository.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Country deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReorderMarketplaceCountries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]): Promise<void> =>
      marketplaceCountryRepository.reorder(orderedIds),
    onMutate: async (orderedIds: string[]) => {
      await qc.cancelQueries({ queryKey: LIST_KEY });
      const prev = qc.getQueryData<MarketplaceCountryListResponse>(LIST_KEY);
      if (prev) {
        const byId = new Map(prev.items.map((c) => [c.id, c]));
        const reordered = orderedIds
          .map((id, idx) => {
            const c = byId.get(id);
            return c ? { ...c, display_order: idx + 1 } : null;
          })
          .filter((c): c is MarketplaceCountry => c !== null);
        qc.setQueryData<MarketplaceCountryListResponse>(LIST_KEY, {
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
