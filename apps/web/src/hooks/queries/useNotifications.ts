"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationRepository } from "@/lib/api/repositories";
import type { NotificationListResponse, UnreadCountResponse } from "@/lib/types";
import { queryKeys } from "../queryKeys";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useNotifications(params: { limit?: number; before_id?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: (): Promise<NotificationListResponse> =>
      notificationRepository.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: (): Promise<UnreadCountResponse> => notificationRepository.unreadCount(),
    refetchInterval: FIVE_MINUTES,
    staleTime: 0,
  });
}
