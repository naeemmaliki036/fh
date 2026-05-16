"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { listingInterestedCustomersRepository } from "@/lib/api/repositories";
import type { ListingInterestedCustomer, LinkCustomerToListingRequest } from "@/lib/types/customer";
import { queryKeys } from "../queryKeys";

export function useLinkCustomerToListing(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LinkCustomerToListingRequest): Promise<ListingInterestedCustomer> =>
      listingInterestedCustomersRepository.link(listingId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.interestedCustomers(listingId) });
      toast.success("Customer linked to listing");
    },
    onError: (e: Error) => {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        toast.error("This listing already has 10 interested customers");
        return;
      }
      toast.error(e.message);
    },
  });
}

export function useUnlinkCustomerFromListing(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string): Promise<void> =>
      listingInterestedCustomersRepository.unlink(listingId, customerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.interestedCustomers(listingId) });
      toast.success("Customer removed from listing");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
