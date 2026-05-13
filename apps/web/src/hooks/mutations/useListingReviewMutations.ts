"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listingRepository } from "@/lib/api/repositories";
import type { Listing, SubmitForReviewRequest, ReviewDecisionRequest } from "@/lib/types/listing";
import { queryKeys } from "../queryKeys";

export function useSubmitForReview(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitForReviewRequest): Promise<Listing> =>
      listingRepository.submitForReview(listingId, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success("Listing submitted for review");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useReviewDecision(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewDecisionRequest): Promise<Listing> =>
      listingRepository.reviewDecision(listingId, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success(
        data.status === "approved" ? "Listing approved" : "Changes requested",
      );
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function usePublishListing(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<Listing> => listingRepository.publishToMarket(listingId),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success("Listing published to market");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
