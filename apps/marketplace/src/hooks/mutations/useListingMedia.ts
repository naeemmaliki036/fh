"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteListingMedia,
  reorderListingMedia,
} from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import type { ConsumerListingMediaItem } from "@fh/portal-types";

async function uploadListingMedia(
  listingId: string,
  file: File,
): Promise<ConsumerListingMediaItem> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await marketplaceAuthedApi.post<ConsumerListingMediaItem>(
    `/consumer/me/listings/${listingId}/media`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

function mediaKey(listingId: string): readonly string[] {
  return ["consumer", "listing-media", listingId] as const;
}

export function useUploadMedia(
  listingId: string,
): UseMutationResult<ConsumerListingMediaItem, Error, File> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadListingMedia(listingId, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mediaKey(listingId) });
    },
    onError: () => {
      toast.error("Upload failed. Check file type and size.");
    },
  });
}

export function useDeleteMedia(
  listingId: string,
): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) =>
      deleteListingMedia(marketplaceAuthedApi, listingId, mediaId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mediaKey(listingId) });
    },
    onError: () => {
      toast.error("Failed to delete photo.");
    },
  });
}

export function useReorderMedia(
  listingId: string,
): UseMutationResult<void, Error, string[]> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderListingMedia(marketplaceAuthedApi, listingId, orderedIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mediaKey(listingId) });
    },
    onError: () => {
      toast.error("Failed to reorder photos.");
    },
  });
}

export { mediaKey };
