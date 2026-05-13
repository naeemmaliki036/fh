"use client";

import { useQuery } from "@tanstack/react-query";
import { emailOutboxRepository } from "@/lib/api/repositories";
import type { EmailOutboxListParams, EmailOutboxListResponse, EmailOutboxItem } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useEmailOutbox(params: EmailOutboxListParams = {}) {
  return useQuery({
    queryKey: queryKeys.emailOutbox.list(params as Record<string, unknown>),
    queryFn: (): Promise<EmailOutboxListResponse> => emailOutboxRepository.list(params),
  });
}

export function useEmailOutboxItem(id: string) {
  return useQuery({
    queryKey: queryKeys.emailOutbox.detail(id),
    queryFn: (): Promise<EmailOutboxItem> => emailOutboxRepository.getById(id),
    enabled: !!id,
  });
}
