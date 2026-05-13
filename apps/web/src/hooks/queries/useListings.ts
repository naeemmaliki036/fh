"use client";

import { useQuery } from "@tanstack/react-query";
import { listingRepository, userRepository } from "@/lib/api/repositories";
import type { Listing, ListingListResponse, ListingListParams } from "@/lib/types/listing";
import type { UserListResponse } from "@/lib/types/user";
import { queryKeys } from "../queryKeys";

export function useListings(params?: ListingListParams) {
  return useQuery({
    queryKey: queryKeys.listings.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<ListingListResponse> => listingRepository.listListings(params),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: (): Promise<Listing> => listingRepository.getById(id),
    enabled: !!id,
  });
}

export function useMyPendingReviews(reviewerId: string) {
  return useQuery({
    queryKey: queryKeys.listings.pendingReviews(reviewerId),
    queryFn: (): Promise<ListingListResponse> =>
      listingRepository.listListings({
        status: "pending_review",
        assigned_reviewer_id: reviewerId,
      }),
    enabled: !!reviewerId,
  });
}

export function useEligibleReviewers() {
  return useQuery({
    queryKey: queryKeys.users.eligibleReviewers,
    queryFn: (): Promise<UserListResponse> => userRepository.listEligibleReviewers(),
  });
}
