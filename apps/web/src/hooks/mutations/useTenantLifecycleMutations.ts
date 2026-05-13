"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantAdminRepository } from "@/lib/api/repositories";
import type { Tenant, TenantLifecycleRequest } from "@/lib/types";
import { queryKeys } from "../queryKeys";

function invalidateTenantQueries(qc: ReturnType<typeof useQueryClient>, id: string): void {
  qc.invalidateQueries({ queryKey: queryKeys.tenants.all });
  qc.invalidateQueries({ queryKey: queryKeys.tenants.adminDetail(id) });
}

export function useApproveTenantAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<Tenant> => tenantAdminRepository.approve(id),
    onSuccess: (data) => {
      invalidateTenantQueries(qc, data.id);
      toast.success("Tenant approved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRejectTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TenantLifecycleRequest }): Promise<Tenant> =>
      tenantAdminRepository.reject(id, body),
    onSuccess: (data) => {
      invalidateTenantQueries(qc, data.id);
      toast.success("Tenant rejected");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSuspendTenantAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TenantLifecycleRequest }): Promise<Tenant> =>
      tenantAdminRepository.suspend(id, body),
    onSuccess: (data) => {
      invalidateTenantQueries(qc, data.id);
      toast.success("Tenant suspended");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: TenantLifecycleRequest;
    }): Promise<Tenant> => tenantAdminRepository.reactivate(id, body),
    onSuccess: (data) => {
      invalidateTenantQueries(qc, data.id);
      toast.success("Tenant reactivated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
