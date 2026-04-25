"use client";

import { useQuery } from "@tanstack/react-query";
import { leadRepository } from "@/lib/api/repositories";
import type { Lead, LeadListResponse, LeadListParams } from "@/lib/types/lead";
import type { LeadActivity } from "@/lib/types/lead-activity";
import { queryKeys } from "../queryKeys";

export function useLeads(params?: LeadListParams) {
  return useQuery({
    queryKey: queryKeys.leads.list(params as Record<string, unknown> | undefined),
    queryFn: (): Promise<LeadListResponse> => leadRepository.listLeads(params),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: (): Promise<Lead> => leadRepository.getById(id),
    enabled: !!id,
  });
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: queryKeys.leads.activities(leadId),
    queryFn: (): Promise<LeadActivity[]> => leadRepository.listActivities(leadId),
    enabled: !!leadId,
  });
}
