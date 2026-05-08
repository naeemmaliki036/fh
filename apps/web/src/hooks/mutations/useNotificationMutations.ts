"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationRepository } from "@/lib/api/repositories";
import type { Notification } from "@/lib/types";
import { queryKeys } from "../queryKeys";

function invalidateNotificationQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<Notification> => notificationRepository.markRead(id),
    onSuccess: () => {
      invalidateNotificationQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<void> => notificationRepository.markAllRead(),
    onSuccess: () => {
      invalidateNotificationQueries(queryClient);
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
