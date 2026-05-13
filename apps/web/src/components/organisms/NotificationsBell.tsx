"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Clock,
  FileText,
  Activity,
  Inbox,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { useAlertCenter } from "@/hooks/features/useAlertCenter";
import type { AlertItem, AlertKind } from "@/hooks/features/useAlertCenter";

// ─── Icon mapping ────────────────────────────────────────────────────────────

function AlertIcon({ kind }: { kind: AlertKind }): React.ReactElement {
  if (kind === "overdue_lead") {
    return <Clock className="h-3.5 w-3.5 text-warning shrink-0" />;
  }
  if (kind === "pending_doc_request") {
    return <FileText className="h-3.5 w-3.5 text-primary shrink-0" />;
  }
  return <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

// ─── Single row ──────────────────────────────────────────────────────────────

function AlertRow({ item }: { item: AlertItem }): React.ReactElement {
  const inner = (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md px-3 py-2.5 cursor-pointer",
        "hover:bg-accent transition-colors",
        item.isUnread && "bg-primary/5",
      )}
    >
      <span className="mt-0.5">
        <AlertIcon kind={item.kind} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug line-clamp-2">
          {item.title}
        </p>
        <span className="text-[11px] text-muted-foreground">
          {item.timeAgo}
        </span>
      </div>
      {item.isUnread && (
        <span
          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          aria-hidden
        />
      )}
    </div>
  );

  if (item.ctaHref) {
    return (
      <DropdownMenu.Item asChild>
        <Link href={item.ctaHref} className="block outline-none">
          {inner}
        </Link>
      </DropdownMenu.Item>
    );
  }

  return <DropdownMenu.Item className="outline-none">{inner}</DropdownMenu.Item>;
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton(): React.ReactElement {
  return (
    <div className="space-y-1 px-2 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-2.5 px-3 py-2.5 animate-pulse">
          <div className="h-3.5 w-3.5 rounded bg-muted mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bell trigger button ─────────────────────────────────────────────────────

interface BellTriggerProps {
  unreadCount: number;
}

function BellTrigger({ unreadCount }: BellTriggerProps): React.ReactElement {
  return (
    <DropdownMenu.Trigger asChild>
      <button
        type="button"
        aria-label={`Alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md",
          "text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute right-1 top-1 flex h-4 w-4 items-center justify-center",
              "rounded-full bg-destructive text-[10px] font-bold",
              "text-destructive-foreground leading-none",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </DropdownMenu.Trigger>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationsBell(): React.ReactElement {
  const { items, unreadCount, isLoading, markAllRead } = useAlertCenter();

  const handleOpenChange = useCallback(
    (isOpen: boolean): void => {
      if (isOpen && unreadCount > 0) {
        markAllRead();
      }
    },
    [unreadCount, markAllRead],
  );

  return (
    <DropdownMenu.Root onOpenChange={handleOpenChange}>
      <BellTrigger unreadCount={unreadCount} />

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-80 rounded-xl border bg-popover shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <span className="text-sm font-semibold">Alerts</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className={cn(
                  "flex items-center gap-1 text-xs text-muted-foreground",
                  "underline-offset-2 hover:underline",
                )}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto py-1">
            {isLoading ? (
              <LoadingSkeleton />
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              items.map((item) => <AlertRow key={item.id} item={item} />)
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2">
            <DropdownMenu.Item asChild>
              <Link
                href="/notifications"
                className={cn(
                  "block text-center text-xs text-muted-foreground",
                  "underline-offset-2 hover:underline outline-none",
                )}
              >
                View all activity
              </Link>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
