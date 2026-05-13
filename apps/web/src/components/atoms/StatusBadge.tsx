import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { TenantStatus, UserStatus, AgentStatus } from "@/lib/types";

type KnownStatus = TenantStatus | UserStatus | AgentStatus;
export type StatusVariant = "success" | "warning" | "destructive" | "info" | "muted";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success:
    "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  destructive:
    "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  info:
    "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  muted:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
};

const STATUS_CONFIG: Partial<Record<KnownStatus, { label: string; variant: StatusVariant }>> = {
  active: { label: "Active", variant: "success" },
  pending_approval: { label: "Pending Approval", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
  disabled: { label: "Disabled", variant: "muted" },
  inactive: { label: "Inactive", variant: "muted" },
  on_leave: { label: "On Leave", variant: "warning" },
};

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, variant, className }, ref) => {
    const config = STATUS_CONFIG[status as KnownStatus];
    const resolvedVariant: StatusVariant = variant ?? config?.variant ?? "muted";
    const label = config?.label ?? status;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5",
          "font-mono text-[10px] uppercase tracking-wider",
          VARIANT_CLASSES[resolvedVariant],
          className,
        )}
      >
        {label}
      </span>
    );
  },
);

StatusBadge.displayName = "StatusBadge";
