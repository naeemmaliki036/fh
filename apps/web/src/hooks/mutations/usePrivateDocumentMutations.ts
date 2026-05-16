"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { privateDocumentRepository } from "@/lib/api/repositories";
import type { RejectDocumentRequest } from "@/lib/types/customer";
import type { PrivateDocument } from "@/lib/types/private-document";
import { queryKeys } from "../queryKeys";

export function useApproveDocument(customerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<PrivateDocument> =>
      privateDocumentRepository.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.privateDocuments.all });
      if (customerId) {
        qc.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
      toast.success("Document approved");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useRejectDocument(customerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectDocumentRequest }): Promise<PrivateDocument> =>
      privateDocumentRepository.reject(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.privateDocuments.all });
      if (customerId) {
        qc.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      }
      toast.success("Document rejected");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
