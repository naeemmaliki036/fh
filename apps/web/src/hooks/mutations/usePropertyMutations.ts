"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyRepository } from "@/lib/api/repositories";
import type {
  Property,
  PropertyCreateRequest,
  PropertyUpdateRequest,
  PropertyAgentAssignment,
  PropertyAgentAssignRequest,
  PropertyAgentPatchRequest,
  PropertyStatusChangeRequest,
} from "@/lib/types/property";
import { queryKeys } from "../queryKeys";

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PropertyCreateRequest): Promise<Property> =>
      propertyRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Property created");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PropertyUpdateRequest): Promise<Property> =>
      propertyRepository.update(id, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.properties.detail(id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Property updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => propertyRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Property deleted");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useChangePropertyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & PropertyStatusChangeRequest): Promise<Property> =>
      propertyRepository.changeStatus(id, body),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.properties.detail(data.id), data);
      qc.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Property status updated");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useAssignAgent(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PropertyAgentAssignRequest): Promise<PropertyAgentAssignment> =>
      propertyRepository.assignAgent(propertyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.detail(propertyId) });
      toast.success("Agent assigned");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUpdateAgentAssignment(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, body }: { agentId: string; body: PropertyAgentPatchRequest }): Promise<PropertyAgentAssignment> =>
      propertyRepository.updateAgentAssignment(propertyId, agentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.detail(propertyId) });
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}

export function useUnassignAgent(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string): Promise<void> =>
      propertyRepository.unassignAgent(propertyId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.properties.detail(propertyId) });
      toast.success("Agent removed");
    },
    onError: (e: Error) => { toast.error(e.message); },
  });
}
