"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMyListing,
  updateMyListing,
  submitListing,
} from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ConsumerListingCreateRequest,
  ConsumerListingItem,
  ConsumerListingUpdateRequest,
} from "@fh/portal-types";

export function useCreateDraft(): UseMutationResult<
  ConsumerListingItem,
  Error,
  ConsumerListingCreateRequest
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConsumerListingCreateRequest) =>
      createMyListing(marketplaceAuthedApi, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.myListings() });
    },
    onError: () => {
      toast.error("Failed to save draft. Please try again.");
    },
  });
}

export function usePatchDraft(): UseMutationResult<
  ConsumerListingItem,
  Error,
  { id: string; body: ConsumerListingUpdateRequest }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) =>
      updateMyListing(marketplaceAuthedApi, id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.myListings() });
    },
    onError: () => {
      toast.error("Failed to save. Please try again.");
    },
  });
}

export function useSubmitListing(): UseMutationResult<
  ConsumerListingItem,
  Error,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitListing(marketplaceAuthedApi, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.myListings() });
      toast.success("Submitted for review! You'll hear from us within 24 hours.");
    },
    onError: () => {
      toast.error("Failed to submit. Please try again.");
    },
  });
}
