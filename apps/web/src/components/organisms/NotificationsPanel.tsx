"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/queries/useNotifications";
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/mutations/useNotificationMutations";
import type { Notification } from "@/lib/types";

const PAGE_SIZE = 20;

function NotificationItem({ notification }: { notification: Notification }): React.ReactElement {
  const { mutate: markRead, isPending } = useMarkNotificationRead();

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4 transition-colors",
        !notification.is_read && "bg-primary/5 border-primary/20",
      )}
    >
      {!notification.is_read && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
      )}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="font-semibold text-sm leading-snug">{notification.title}</span>
        <p className="text-sm text-muted-foreground">{notification.body}</p>
        <span className="text-xs text-muted-foreground/70">
          {formatRelativeTime(notification.created_at)}
        </span>
      </div>
      {!notification.is_read && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 self-start text-xs"
          disabled={isPending}
          onClick={() => markRead(notification.id)}
        >
          Mark read
        </Button>
      )}
    </div>
  );
}

export function NotificationsPanel(): React.ReactElement {
  const [beforeId, setBeforeId] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<Notification[]>([]);
  const seenIdsRef = useRef(new Set<string>());

  const { data, isFetching } = useNotifications({ limit: PAGE_SIZE, before_id: beforeId });
  const { mutate: markAll, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  // Accumulate new pages when data arrives.
  useEffect(() => {
    if (!data?.items.length) return;
    const fresh = data.items.filter((n) => !seenIdsRef.current.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seenIdsRef.current.add(n.id));
    setAccumulated((prev) => [...prev, ...fresh]);
  }, [data]);

  const handleLoadMore = useCallback((): void => {
    const last = accumulated[accumulated.length - 1];
    if (last) setBeforeId(last.id);
  }, [accumulated]);

  // Reset on first load (beforeId undefined) so first-page items populate accumulated.
  const displayItems = accumulated;
  const showLoadMore = data?.has_more ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={isMarkingAll}
          onClick={() => markAll()}
        >
          Mark all read
        </Button>
      </div>

      {displayItems.length === 0 && !isFetching && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No notifications yet
        </p>
      )}

      <div className="space-y-2">
        {displayItems.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>

      {showLoadMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
          >
            {isFetching ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
