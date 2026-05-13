"use client";

import { useQuery } from "@tanstack/react-query";
import { emailTemplatesRepository } from "@/lib/api/repositories";
import type { EmailTemplateListParams, EmailTemplateListResponse, EmailTemplate } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useEmailTemplates(params: EmailTemplateListParams = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.list(params as Record<string, unknown>),
    queryFn: (): Promise<EmailTemplateListResponse> => emailTemplatesRepository.list(params),
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.detail(id),
    queryFn: (): Promise<EmailTemplate> => emailTemplatesRepository.getById(id),
    enabled: !!id,
  });
}
