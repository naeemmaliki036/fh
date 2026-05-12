"use client";

import { useQuery } from "@tanstack/react-query";
import { userRepository } from "@/lib/api/repositories";
import type { User, UserListResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

interface UseUsersParams {
  q?: string;
}

export function useUsers(params?: UseUsersParams) {
  return useQuery({
    queryKey: queryKeys.users.list,
    queryFn: (): Promise<UserListResponse> => userRepository.listUsers(),
    select: (data: UserListResponse): UserListResponse => {
      const q = params?.q?.toLowerCase().trim();
      if (!q) return data;
      const filtered = data.items.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
      return { ...data, items: filtered, total: filtered.length };
    },
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
