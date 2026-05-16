"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantRepository } from "@/lib/api/repositories";
import type { Tenant, TenantUpdateRequest } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useApproveTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<Tenant> => tenantRepository.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      toast.success("Tenant approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<Tenant> => tenantRepository.suspend(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      toast.success("Tenant suspended");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMyTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TenantUpdateRequest): Promise<Tenant> =>
      tenantRepository.updateMyTenant(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenants.my, data);
      toast.success("Company settings saved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePropertyRefPrefix(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefix: string): Promise<Tenant> =>
      tenantRepository.updatePropertyRefPrefix(tenantId, { property_ref_prefix: prefix }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.tenants.detail(data.id), data);
      queryClient.setQueryData(queryKeys.tenants.my, data);
      toast.success("Property reference prefix updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
