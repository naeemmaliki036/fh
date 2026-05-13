"use client";

import { cn } from "@/lib/utils/cn";
import type { Lead } from "@/lib/types/lead";

export type DayCellState = "overdue" | "today" | "soon" | "neutral";

interface CalendarDayCellProps {
  date: Date;
  leads: Lead[];
  isCurrentMonth: boolean;
  isToday: boolean;
  state: DayCellState;
  onClick: (date: Date, leads: Lead[]) => void;
}

function LeadPill({ lead }: { lead: Lead }): React.ReactElement {
  const name = lead.customer?.full_name ?? "Unknown";
  return (
    <span className="block truncate rounded bg-muted px-1 py-0.5 text-[10px] leading-tight text-muted-foreground">
      {name}
    </span>
  );
}

export function CalendarDayCell({
  date,
  leads,
  isCurrentMonth,
  isToday,
  state,
  onClick,
}: CalendarDayCellProps): React.ReactElement {
  const visible = leads.slice(0, 3);
  const overflow = leads.length - visible.length;

  const cellBg: Record<DayCellState, string> = {
    overdue: "bg-destructive/10",
    today: "ring-2 ring-inset ring-green-500",
    soon: "ring-2 ring-inset ring-amber-400",
    neutral: "",
  };

  return (
    <button
      type="button"
      onClick={() => onClick(date, leads)}
      className={cn(
        "relative flex min-h-[80px] w-full flex-col gap-0.5 rounded-md border border-border p-1.5 text-left transition-colors hover:bg-accent/50",
        !isCurrentMonth && "opacity-40",
        cellBg[state],
      )}
    >
      <span
        className={cn(
          "mb-0.5 self-end text-xs font-medium",
          isToday
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            : "text-foreground",
        )}
      >
        {date.getDate()}
      </span>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {visible.map((l) => (
          <LeadPill key={l.id} lead={l} />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-muted-foreground">+{overflow} more</span>
        )}
      </div>
    </button>
  );
}
