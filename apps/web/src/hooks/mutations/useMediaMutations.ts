"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyRepository, mediaRepository } from "@/lib/api/repositories";
import type { Media, MediaUpdateRequest, MediaKind } from "@/lib/types/media";
import { queryKeys } from "../queryKeys";

export function useUploadMedia(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, kind, altText }: { file: File; kind: MediaKind; altText?: string }): Promise<Media> =>
      propertyRepository.uploadMedia(propertyId, file, kind, altText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.media(propertyId) });
      toast.success("Media uploaded");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateMedia(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & MediaUpdateRequest): Promise<Media> =>
      mediaRepository.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.media(propertyId) });
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteMedia(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => mediaRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.media(propertyId) });
      toast.success("Media deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useReorderMedia(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]): Promise<Media[]> =>
      propertyRepository.reorderMedia(propertyId, orderedIds),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.properties.media(propertyId), data);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
