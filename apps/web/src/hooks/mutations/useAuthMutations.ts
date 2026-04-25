"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authRepository } from "@/lib/api/repositories";
import type {
  LoginRequest,
  LoginResponse,
  PlatformLoginRequest,
  PlatformLoginResponse,
  RegisterTenantRequest,
  RegisterTenantResponse,
} from "@/lib/types";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "../queryKeys";

export function useRegisterTenant() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterTenantRequest): Promise<RegisterTenantResponse> =>
      authRepository.registerTenant(data),
    onSuccess: () => {
      router.push("/pending-approval");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginRequest): Promise<LoginResponse> =>
      authRepository.login(data),
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      if (error instanceof ApiError && error.isPendingApproval) {
        router.push("/pending-approval");
        return;
      }
      toast.error(error.message);
    },
  });
}

export function usePlatformLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: PlatformLoginRequest): Promise<PlatformLoginResponse> =>
      authRepository.platformLogin(data),
    onSuccess: () => {
      router.push("/tenants");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      authRepository.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });
}

export function usePlatformLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      authRepository.platformLogout();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.platformMe });
      router.push("/platform-login");
    },
  });
}
