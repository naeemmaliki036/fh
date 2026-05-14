"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { documentRequestRepository } from "@/lib/api/repositories";
import type {
  DocumentRequest,
  DocumentRequestCreate,
  DocumentRequestCreateResponse,
  RegenerateCodeResponse,
} from "@/lib/types/document-request";
import { queryKeys } from "../queryKeys";

export function useCreateDocumentRequest() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: DocumentRequestCreate): Promise<DocumentRequestCreateResponse> =>
      documentRequestRepository.create(data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.docRequests.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.docRequests.all });
      toast.success("Document request created");
      // Navigate to detail with just_created flag; code/url stored in query cache
      router.push(`/document-requests/${data.id}?just_created=1`);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useCancelDocumentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<DocumentRequest> =>
      documentRequestRepository.cancel(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.docRequests.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.docRequests.all });
      toast.success("Request canceled");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useRegenerateDocumentRequestCode() {
  return useMutation({
    mutationFn: (id: string): Promise<RegenerateCodeResponse> =>
      documentRequestRepository.regenerateCode(id),
    onSuccess: () => {
      toast.success("New code generated — share it with your customer");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useReopenDocumentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<DocumentRequest> =>
      documentRequestRepository.reopen(id),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.docRequests.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.docRequests.all });
      toast.success("Request reopened — customer can upload more documents");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
