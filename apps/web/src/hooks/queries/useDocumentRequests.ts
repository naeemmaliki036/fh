"use client";

import { useQuery } from "@tanstack/react-query";
import { documentRequestRepository } from "@/lib/api/repositories";
import type { DocumentRequest, DocumentRequestListResponse, DocumentRequestListParams } from "@/lib/types/document-request";
import { queryKeys } from "../queryKeys";

export function useDocumentRequests(params?: DocumentRequestListParams) {
  return useQuery({
    queryKey: queryKeys.docRequests.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<DocumentRequestListResponse> =>
      documentRequestRepository.listRequests(params),
  });
}

export function useDocumentRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.docRequests.detail(id),
    queryFn: (): Promise<DocumentRequest> => documentRequestRepository.getById(id),
    enabled: !!id,
  });
}
