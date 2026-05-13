"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarMonthGrid } from "@/components/organisms/CalendarMonthGrid";
import { CalendarDayDetail } from "@/components/organisms/CalendarDayDetail";
import { useLeads } from "@/hooks/queries/useLeads";
import { useAgents } from "@/hooks/queries/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import type { Lead } from "@/lib/types/lead";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

interface DetailState {
  open: boolean;
  date: Date | null;
  leads: Lead[];
}

export function CalendarView(): React.ReactElement {
  const { currentUser } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [detail, setDetail] = useState<DetailState>({ open: false, date: null, leads: [] });

  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];

  // Determine the self-agent if current user has role=agent
  const selfAgent = useMemo(() => {
    if (!currentUser || currentUser.role !== "agent") return null;
    return agents.find((a) => a.linked_user_id === currentUser.id) ?? null;
  }, [currentUser, agents]);

  // Default filter: if current user is an agent, scope to self. Otherwise "all".
  const [agentFilter, setAgentFilter] = useState<string>("__all__");
  const [selfResolved, setSelfResolved] = useState(false);

  // Once selfAgent resolves, initialise the filter exactly once
  useEffect(() => {
    if (!selfResolved && selfAgent) {
      setAgentFilter(selfAgent.id);
      setSelfResolved(true);
    }
  }, [selfAgent, selfResolved]);

  const { from, to } = useMemo(() => getMonthRange(year, month), [year, month]);

  const queryParams = useMemo(() => ({
    next_action_from: from,
    next_action_to: to,
    ...(agentFilter !== "__all__" ? { assigned_agent_id: agentFilter } : {}),
    limit: 200,
  }), [from, to, agentFilter]);

  const { data, isLoading } = useLeads(queryParams);
  const leads = data?.items ?? [];

  function prevMonth(): void {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth(): void {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToday(): void {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const handleDayClick = useCallback((date: Date, dayLeads: Lead[]): void => {
    setDetail({ open: true, date, leads: dayLeads });
  }, []);

  const closeDetail = useCallback((): void => {
    setDetail((d) => ({ ...d, open: false }));
  }, []);

  const isManager = currentUser?.role !== "agent";

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-semibold">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>

        {/* Agent filter — only for managers/admins */}
        {isManager && agents.length > 0 && (
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {isLoading && (
          <span className="text-xs text-muted-foreground">Loading...</span>
        )}
      </div>

      {/* Month grid */}
      <CalendarMonthGrid
        year={year}
        month={month}
        leads={leads}
        onDayClick={handleDayClick}
      />

      {/* Day detail dialog */}
      <CalendarDayDetail
        open={detail.open}
        onClose={closeDetail}
        date={detail.date}
        leads={detail.leads}
      />
    </div>
  );
}
