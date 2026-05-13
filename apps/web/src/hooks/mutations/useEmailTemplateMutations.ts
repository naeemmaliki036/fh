"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { emailTemplatesRepository } from "@/lib/api/repositories";
import type {
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
  TestSendRequest,
  TestSendResponse,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

function invalidate(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.all });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmailTemplateCreateRequest): Promise<EmailTemplate> =>
      emailTemplatesRepository.create(data),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Template created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateEmailTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmailTemplateUpdateRequest): Promise<EmailTemplate> =>
      emailTemplatesRepository.update(id, data),
    onSuccess: () => {
      invalidate(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.detail(id) });
      toast.success("Template saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => emailTemplatesRepository.remove(id),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Template deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTestSendEmailTemplate() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: TestSendRequest;
    }): Promise<TestSendResponse> => emailTemplatesRepository.testSend(id, data),
    onError: (err: Error) => toast.error(err.message),
  });
}
