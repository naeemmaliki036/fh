"use client";

import { useQuery } from "@tanstack/react-query";
import { privateDocumentRepository } from "@/lib/api/repositories";
import type { PendingDocumentQueueResponse, PendingDocumentQueueParams } from "@/lib/types/customer";
import { queryKeys } from "../queryKeys";

export function usePendingDocuments(params?: PendingDocumentQueueParams) {
  return useQuery({
    queryKey: queryKeys.privateDocuments.pending(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<PendingDocumentQueueResponse> =>
      privateDocumentRepository.listPending(params),
  });
}
