import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMyListing,
  updateMyListing,
  deleteMyListing,
  markListingStatus,
} from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ConsumerListingCreateRequest,
  ConsumerListingItem,
  ConsumerListingMarkStatusRequest,
  ConsumerListingUpdateRequest,
} from "@fh/portal-types";

export function useCreateListing(): UseMutationResult<
  ConsumerListingItem,
  Error,
  ConsumerListingCreateRequest
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConsumerListingCreateRequest) =>
      createMyListing(marketplaceAuthedApi, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.me });
      void qc.invalidateQueries({ queryKey: ["consumer", "my-listings"] });
      toast.success("Listing posted successfully!");
    },
    onError: () => {
      toast.error("Failed to create listing. Please try again.");
    },
  });
}

export function useUpdateListing(): UseMutationResult<
  ConsumerListingItem,
  Error,
  { id: string; body: ConsumerListingUpdateRequest }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateMyListing(marketplaceAuthedApi, id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["consumer", "my-listings"] });
      toast.success("Listing updated.");
    },
    onError: () => {
      toast.error("Failed to update listing.");
    },
  });
}

export function useDeleteListing(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMyListing(marketplaceAuthedApi, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.me });
      void qc.invalidateQueries({ queryKey: ["consumer", "my-listings"] });
      toast.success("Listing archived.");
    },
    onError: () => {
      toast.error("Failed to delete listing.");
    },
  });
}

export function useMarkListingStatus(): UseMutationResult<
  ConsumerListingItem,
  Error,
  { id: string; body: ConsumerListingMarkStatusRequest }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => markListingStatus(marketplaceAuthedApi, id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["consumer", "my-listings"] });
      toast.success("Listing status updated.");
    },
    onError: () => {
      toast.error("Failed to update listing status.");
    },
  });
}
