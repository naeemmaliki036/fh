"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { emailOutboxRepository } from "@/lib/api/repositories";
import type { EmailOutboxItem, ProcessOutboxResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

function invalidate(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.emailOutbox.all });
}

export function useRetryEmailOutbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<EmailOutboxItem> => emailOutboxRepository.retry(id),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Queued for retry");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useProcessEmailOutbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<ProcessOutboxResponse> => emailOutboxRepository.process(),
    onSuccess: (data) => {
      invalidate(queryClient);
      toast.success(`Processed: ${data.sent} sent, ${data.failed} failed`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
