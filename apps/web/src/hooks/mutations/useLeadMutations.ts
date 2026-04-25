"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadRepository } from "@/lib/api/repositories";
import type {
  Lead,
  LeadCreateRequest,
  LeadUpdateRequest,
  LeadTransitionRequest,
  LeadAssignRequest,
} from "@/lib/types/lead";
import { LeadConflictError } from "@/lib/types/lead";
import type { LeadActivity, LeadActivityCreateRequest } from "@/lib/types/lead-activity";
import { queryKeys } from "../queryKeys";

interface CreateLeadCallbacks {
  onConflict?: (existingCustomerId: string, message: string) => void;
  onSuccess?: (lead: Lead) => void;
}

export function useCreateLead(callbacks?: CreateLeadCallbacks) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadCreateRequest): Promise<Lead> => leadRepository.create(data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      toast.success("Lead created");
      callbacks?.onSuccess?.(data);
    },
    onError: (err: Error) => {
      if (err instanceof LeadConflictError) {
        callbacks?.onConflict?.(err.existingCustomerId, err.message);
        return;
      }
      toast.error(err.message);
    },
  });
}

export function useUpdateLead(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadUpdateRequest): Promise<Lead> =>
      leadRepository.update(leadId, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.leads.detail(leadId), data);
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      toast.success("Lead updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useTransitionLead(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LeadTransitionRequest): Promise<Lead> =>
      leadRepository.transition(leadId, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.leads.detail(leadId), data);
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.leads.activities(leadId) });
      toast.success(`Stage → ${data.stage}`);
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useAssignLead(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LeadAssignRequest): Promise<Lead> =>
      leadRepository.assign(leadId, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.leads.detail(leadId), data);
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.leads.activities(leadId) });
      toast.success(data.assigned_agent_id ? "Agent assigned" : "Agent unassigned");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useAddLeadActivity(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LeadActivityCreateRequest): Promise<LeadActivity> =>
      leadRepository.addActivity(leadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.activities(leadId) });
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteLeadActivity(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string): Promise<void> =>
      leadRepository.deleteActivity(leadId, activityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.activities(leadId) });
      toast.success("Note deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
