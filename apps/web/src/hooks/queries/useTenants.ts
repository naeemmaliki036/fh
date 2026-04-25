"use client";

import { useQuery } from "@tanstack/react-query";
import { tenantRepository } from "@/lib/api/repositories";
import type { Tenant, TenantListResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useTenants(status?: string) {
  return useQuery({
    queryKey: queryKeys.tenants.list(status),
    queryFn: (): Promise<TenantListResponse> => tenantRepository.listTenants(status),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: (): Promise<Tenant> => tenantRepository.getById(id),
    enabled: !!id,
  });
}

export function useMyTenant() {
  return useQuery({
    queryKey: queryKeys.tenants.my,
    queryFn: (): Promise<Tenant> => tenantRepository.getMyTenant(),
    retry: false,
  });
}
