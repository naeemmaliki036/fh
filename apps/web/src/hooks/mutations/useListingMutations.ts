"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listingRepository } from "@/lib/api/repositories";
import type { Listing, ListingCreateRequest, ListingUpdateRequest, ListingStatusChangeRequest } from "@/lib/types/listing";
import { queryKeys } from "../queryKeys";

export function useCreateListing(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ListingCreateRequest): Promise<Listing> =>
      listingRepository.createForProperty(propertyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing created");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateListing(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & ListingUpdateRequest): Promise<Listing> =>
      listingRepository.update(id, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteListing(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => listingRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useActivateListing(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<Listing> => listingRepository.activate(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing activated");
    },
    onError: (e: Error) => { toast.error(`Cannot activate: ${e.message}`); },
  });
}

export function usePauseListing(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<Listing> => listingRepository.pause(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing paused");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useArchiveListing(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<Listing> => listingRepository.archive(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing archived");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useChangeListingStatus(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & ListingStatusChangeRequest): Promise<Listing> =>
      listingRepository.changeStatus(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.listings(propertyId) });
      toast.success("Listing status updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useVerifyListing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string): Promise<Listing> => listingRepository.verify(id, note),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success("Listing verified");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUnverifyListing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string): Promise<Listing> => listingRepository.unverify(id, note),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listings.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success("Listing unverified");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
