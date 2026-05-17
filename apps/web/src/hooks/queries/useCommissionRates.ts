"use client";

import { useQuery } from "@tanstack/react-query";
import { commissionRatesRepository } from "@/lib/api/repositories";
import type { TenantCommissionRate, CommissionRateAuditEntry, TransactionType } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useCommissionRates(): ReturnType<typeof useQuery<TenantCommissionRate[]>> {
  return useQuery({
    queryKey: queryKeys.commissionRates.all,
    queryFn: (): Promise<TenantCommissionRate[]> => commissionRatesRepository.list(),
  });
}

export function useCommissionRateAudit(
  transactionType: TransactionType,
  enabled: boolean,
): ReturnType<typeof useQuery<CommissionRateAuditEntry[]>> {
  return useQuery({
    queryKey: queryKeys.commissionRates.audit(transactionType),
    queryFn: (): Promise<CommissionRateAuditEntry[]> =>
      commissionRatesRepository.getAudit(transactionType),
    enabled,
  });
}
