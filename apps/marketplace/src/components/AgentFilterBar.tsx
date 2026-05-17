"use client";

// Filter chip row for the /agents page.
// Backend supports: country (read-only display), q, page, page_size.
// No sort / verified params on GET /marketplace/agents — omitted intentionally.

import { X, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

// Agents sort is fixed server-side (active listings desc → licensed first →
// alphabetical). The backend GET /marketplace/agents does NOT expose a sort
// query param, so we offer only the two orderings that map to the fixed order.
// "Most active" is the default; "A-Z" requires client-side sort of the page.
export type AgentSort = "active" | "az";

export const AGENT_SORT_OPTIONS: { value: AgentSort; label: string }[] = [
  { value: "active", label: "Most active" },
  { value: "az", label: "A – Z" },
];

interface AgentFilterBarProps {
  countryLabel: string;
  sort: AgentSort;
  onSortChange: (s: AgentSort) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}

export function AgentFilterBar({
  countryLabel,
  sort,
  onSortChange,
  hasActiveFilters,
  onReset,
}: AgentFilterBarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Country chip — read-only reflection of global country selector */}
      <Chip icon={<MapPin className="h-3 w-3" />} label={countryLabel} />

      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as AgentSort)}
          className={cn(
            "appearance-none rounded-full border border-slate-200 bg-white",
            "pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700",
            "hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300 transition",
            sort !== "active" && "border-teal-400 text-teal-700 bg-teal-50",
          )}
          aria-label="Sort agents"
        >
          {AGENT_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
          ▾
        </span>
      </div>

      {/* Reset link — only visible when a filter is active */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition"
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal atoms
// ---------------------------------------------------------------------------

function Chip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
      {icon}
      {label}
    </span>
  );
}
