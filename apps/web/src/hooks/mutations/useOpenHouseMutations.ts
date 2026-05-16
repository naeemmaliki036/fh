"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openHouseRepository } from "@/lib/api/repositories";
import type {
  OpenHouse,
  OpenHouseCreate,
  OpenHouseUpdate,
  OpenHouseCancelRequest,
} from "@/lib/types/open-house";
import { queryKeys } from "../queryKeys";

export function useCreateOpenHouse(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OpenHouseCreate): Promise<OpenHouse> =>
      openHouseRepository.create(listingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.openHouses.list(listingId) });
      toast.success("Open house scheduled");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}

export function useUpdateOpenHouse(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & OpenHouseUpdate): Promise<OpenHouse> =>
      openHouseRepository.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.openHouses.list(listingId) });
      toast.success("Open house updated");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}

export function useCancelOpenHouse(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & OpenHouseCancelRequest): Promise<OpenHouse> =>
      openHouseRepository.cancel(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.openHouses.list(listingId) });
      toast.success("Open house cancelled");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}
