"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantAdminRepository } from "@/lib/api/repositories";
import type { TenantSendMessageRequest } from "@/lib/types";

export function useSendTenantMessage(tenantId: string) {
  return useMutation({
    mutationFn: (body: TenantSendMessageRequest): Promise<void> =>
      tenantAdminRepository.sendMessage(tenantId, body),
    onSuccess: () => {
      toast.success("Message sent to tenant owner");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
