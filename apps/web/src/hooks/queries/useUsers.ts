"use client";

import { useQuery } from "@tanstack/react-query";
import { userRepository } from "@/lib/api/repositories";
import type { User, UserListResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.list,
    queryFn: (): Promise<UserListResponse> => userRepository.listUsers(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: (): Promise<User> => userRepository.getById(id),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: (): Promise<User> => userRepository.getMe(),
    retry: false,
  });
}
