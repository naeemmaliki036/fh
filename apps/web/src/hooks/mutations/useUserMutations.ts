"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userRepository } from "@/lib/api/repositories";
import type {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserMeUpdateRequest,
} from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreateRequest): Promise<User> =>
      userRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
      toast.success("User created");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UserUpdateRequest): Promise<User> =>
      userRepository.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
      queryClient.setQueryData(queryKeys.users.detail(data.id), data);
      toast.success("User updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => userRepository.disableUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
      toast.success("User disabled");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserMeUpdateRequest): Promise<User> =>
      userRepository.updateMe(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.users.me, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
