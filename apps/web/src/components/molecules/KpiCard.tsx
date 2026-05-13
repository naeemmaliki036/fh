import type { ComponentType } from "react";
import { cn } from "@/lib/utils/cn";

type IconVariant = "success" | "warning" | "destructive" | "info" | "muted";

const ICON_VARIANT_CLASSES: Record<IconVariant, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  destructive: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  muted: "bg-slate-100 text-slate-500",
};

interface KpiCardProps {
  label: string;
  sublabel?: string;
  value: number | string | undefined;
  isLoading?: boolean;
  icon: ComponentType<{ className?: string }>;
  iconVariant?: IconVariant;
  className?: string;
}

export function KpiCard({
  label,
  sublabel,
  value,
  isLoading = false,
  icon: Icon,
  iconVariant = "muted",
  className,
}: KpiCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
          ICON_VARIANT_CLASSES[iconVariant],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <div className="mt-0.5 h-7 w-14 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="text-2xl font-bold leading-none text-slate-900">
            {value ?? "—"}
          </p>
        )}
        <p className="mt-1 truncate text-sm font-medium text-slate-700">{label}</p>
        {sublabel && (
          <p className="truncate text-xs text-slate-400">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
