"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
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

/**
 * Returns the price-validation error message if the Axios error is a 422
 * with a plain-string `detail`. Returns null for other error shapes.
 */
export function extractMarketplacePriceError(err: unknown): string | null {
  if (!isAxiosError(err)) return null;
  const status = err.response?.status;
  if (status !== 422) return null;
  const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string" && detail.length > 0) return detail;
  return null;
}

function isSilenceable(err: unknown): boolean {
  return extractMarketplacePriceError(err) !== null;
}

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
    onError: (err) => {
      if (!isSilenceable(err)) {
        toast.error("Failed to save draft. Please try again.");
      }
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
    onError: (err) => {
      if (!isSilenceable(err)) {
        toast.error("Failed to save. Please try again.");
      }
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
    onError: (err) => {
      if (!isSilenceable(err)) {
        toast.error("Failed to submit. Please try again.");
      }
    },
  });
}
