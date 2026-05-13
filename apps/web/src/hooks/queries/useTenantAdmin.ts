"use client";

import { useQuery } from "@tanstack/react-query";
import { tenantAdminRepository } from "@/lib/api/repositories";
import type { TenantDetailResponse, TenantListParams, TenantListResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useAdminTenants(params?: TenantListParams) {
  return useQuery({
    queryKey: queryKeys.tenants.adminList(params as Record<string, unknown>),
    queryFn: (): Promise<TenantListResponse> => tenantAdminRepository.list(params),
  });
}

export function useAdminTenantDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.adminDetail(id),
    queryFn: (): Promise<TenantDetailResponse> => tenantAdminRepository.getDetail(id),
    enabled: !!id,
  });
}
