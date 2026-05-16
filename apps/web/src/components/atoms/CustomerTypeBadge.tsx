import { Building2 } from "lucide-react";
import type { CustomerType } from "@/lib/types";

interface CustomerTypeBadgeProps {
  type: CustomerType;
}

export function CustomerTypeBadge({ type }: CustomerTypeBadgeProps): React.ReactElement {
  if (type === "company") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        <Building2 className="h-3 w-3" />
        Company
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      Individual
    </span>
  );
}
