"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { platformUsersRepository } from "@/lib/api/repositories";
import type {
  PlatformUser,
  PlatformUserCreateRequest,
  PlatformUserUpdateRequest,
  PlatformUserResetPasswordRequest,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useCreatePlatformUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlatformUserCreateRequest): Promise<PlatformUser> =>
      platformUsersRepository.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platformUsers.all });
      toast.success("Platform user created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePlatformUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PlatformUserUpdateRequest;
    }): Promise<PlatformUser> => platformUsersRepository.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platformUsers.all });
      toast.success("User updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResetPlatformUserPassword() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PlatformUserResetPasswordRequest;
    }): Promise<void> => platformUsersRepository.resetPassword(id, data),
    onSuccess: () => toast.success("Password reset successfully"),
    onError: (err: Error) => toast.error(err.message),
  });
}
