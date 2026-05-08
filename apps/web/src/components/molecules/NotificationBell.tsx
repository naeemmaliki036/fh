"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import { useNotifications, useUnreadCount } from "@/hooks/queries/useNotifications";
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/mutations/useNotificationMutations";
import type { Notification } from "@/lib/types";

function NotificationRow({ notification }: { notification: Notification }): React.ReactElement {
  const router = useRouter();
  const { mutate: markRead } = useMarkNotificationRead();

  const handleClick = (): void => {
    if (!notification.is_read) {
      markRead(notification.id);
    }
    if (notification.link_path) {
      router.push(notification.link_path);
    }
  };

  return (
    <DropdownMenu.Item
      onSelect={handleClick}
      className={cn(
        "flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2.5 text-sm outline-none",
        "hover:bg-accent focus:bg-accent",
        !notification.is_read && "bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2">
        {!notification.is_read && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
        )}
        <span className="font-semibold leading-snug">{notification.title}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
      <span className="text-xs text-muted-foreground/70">
        {formatRelativeTime(notification.created_at)}
      </span>
    </DropdownMenu.Item>
  );
}

export function NotificationBell(): React.ReactElement {
  const { data: countData } = useUnreadCount();
  const { data: listData } = useNotifications({ limit: 10 });
  const { mutate: markAll, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const unread = countData?.unread_count ?? 0;
  const notifications = listData?.items ?? [];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border bg-popover shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={() => markAll()}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => <NotificationRow key={n.id} notification={n} />)
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2">
            <DropdownMenu.Item asChild>
              <Link
                href="/notifications"
                className="block text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                See all notifications
              </Link>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
