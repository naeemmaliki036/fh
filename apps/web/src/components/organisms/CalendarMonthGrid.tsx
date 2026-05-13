"use client";

import { useMemo } from "react";
import type { Lead } from "@/lib/types/lead";
import { CalendarDayCell } from "@/components/molecules/CalendarDayCell";
import type { DayCellState } from "@/components/molecules/CalendarDayCell";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface CalendarMonthGridProps {
  year: number;
  month: number; // 0-indexed
  leads: Lead[];
  onDayClick: (date: Date, leads: Lead[]) => void;
}

function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseLeadDateKey(next_action_at: string): string {
  // next_action_at is ISO datetime — extract date portion in local time
  const d = new Date(next_action_at);
  return toLocalDateKey(d);
}

function buildCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const days: Date[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const trailing = 7 - (days.length % 7);
  if (trailing < 7) {
    for (let d = 1; d <= trailing; d++) {
      days.push(new Date(year, month + 1, d));
    }
  }
  return days;
}

function classifyCell(date: Date, hasTodayLead: boolean, hasOverdue: boolean, hasSoon: boolean): DayCellState {
  if (hasOverdue) return "overdue";
  if (hasTodayLead) return "today";
  if (hasSoon) return "soon";
  return "neutral";
}

export function CalendarMonthGrid({
  year,
  month,
  leads,
  onDayClick,
}: CalendarMonthGridProps): React.ReactElement {
  const today = useMemo(() => toLocalDateKey(new Date()), []);
  const now = useMemo(() => new Date(), []);
  const soonCutoff = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 3);
    return d;
  }, [now]);

  const leadsByDay = useMemo<Record<string, Lead[]>>(() => {
    const map: Record<string, Lead[]> = {};
    for (const lead of leads) {
      if (!lead.next_action_at) continue;
      const key = parseLeadDateKey(lead.next_action_at);
      (map[key] ??= []).push(lead);
    }
    return map;
  }, [leads]);

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  return (
    <div className="flex flex-col gap-1">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-1 text-center text-xs font-semibold text-muted-foreground">
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          const key = toLocalDateKey(date);
          const dayLeads = leadsByDay[key] ?? [];
          const isCurrentMonth = date.getMonth() === month;
          const isToday = key === today;

          const hasOverdue = dayLeads.length > 0 && new Date(date) < now && !isToday;
          const hasSoon = dayLeads.length > 0 && date > now && date <= soonCutoff;
          const state = classifyCell(date, isToday && dayLeads.length > 0, hasOverdue, hasSoon);

          return (
            <CalendarDayCell
              key={`${key}-${idx}`}
              date={date}
              leads={dayLeads}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              state={state}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </div>
  );
}
