"use client";

import { useQuery } from "@tanstack/react-query";
import { priceValidationRepository } from "@/lib/api/repositories";
import type {
  PriceValidationRuleListResponse,
  PriceValidationPreviewResponse,
  PriceValidationPreviewParams,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function usePriceValidationRules() {
  return useQuery({
    queryKey: queryKeys.priceValidation.list,
    queryFn: (): Promise<PriceValidationRuleListResponse> =>
      priceValidationRepository.list(),
  });
}

export function usePriceValidationPreview(params: PriceValidationPreviewParams, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.priceValidation.preview(params as Record<string, unknown>),
    queryFn: (): Promise<PriceValidationPreviewResponse> =>
      priceValidationRepository.preview(params),
    enabled,
  });
}
