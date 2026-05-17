"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commissionRatesRepository } from "@/lib/api/repositories";
import type {
  TenantCommissionRate,
  CommissionRateUpdateRequest,
  TransactionType,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

interface UpdateCommissionRateVariables {
  transactionType: TransactionType;
  body: CommissionRateUpdateRequest;
}

export function useUpdateCommissionRate(): ReturnType<
  typeof useMutation<TenantCommissionRate, Error, UpdateCommissionRateVariables>
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionType, body }: UpdateCommissionRateVariables): Promise<TenantCommissionRate> =>
      commissionRatesRepository.update(transactionType, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.commissionRates.all });
      toast.success("Commission rate updated");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
}
