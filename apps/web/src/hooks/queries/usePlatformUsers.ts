"use client";

import { useQuery } from "@tanstack/react-query";
import { platformUsersRepository } from "@/lib/api/repositories";
import type { PlatformUserListResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

export function usePlatformUsers() {
  return useQuery({
    queryKey: queryKeys.platformUsers.list,
    queryFn: (): Promise<PlatformUserListResponse> => platformUsersRepository.list(),
  });
}
