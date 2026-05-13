"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listingDocumentRepository } from "@/lib/api/repositories";
import type { ListingDocument, ListingDocumentKind } from "@/lib/types/listing-document";
import { queryKeys } from "../queryKeys";

export function useUploadListingDocument(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      kind,
      name,
    }: {
      file: File;
      kind: ListingDocumentKind;
      name?: string;
    }): Promise<ListingDocument> =>
      listingDocumentRepository.upload(listingId, file, kind, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.documents(listingId) });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteListingDocument(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string): Promise<void> =>
      listingDocumentRepository.remove(listingId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.listings.documents(listingId) });
      toast.success("Document removed");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
