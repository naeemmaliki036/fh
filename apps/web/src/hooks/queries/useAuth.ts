"use client";

import { useQuery } from "@tanstack/react-query";
import { authRepository } from "@/lib/api/repositories";
import type { MeResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: (): Promise<MeResponse> => authRepository.me(),
    enabled,
    retry: false,
  });
}

export function usePlatformMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.platformMe,
    queryFn: (): Promise<MeResponse> => authRepository.platformMe(),
    enabled,
    retry: false,
  });
}
