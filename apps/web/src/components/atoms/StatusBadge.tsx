import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { TenantStatus, UserStatus, AgentStatus } from "@/lib/types";

type KnownStatus = TenantStatus | UserStatus | AgentStatus;
export type StatusVariant = "success" | "warning" | "destructive" | "info" | "muted";

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  destructive: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  muted: "bg-slate-100 text-slate-600 border-slate-200",
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
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
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
