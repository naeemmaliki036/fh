"use client";

import { Search, Sparkles } from "lucide-react";

interface AgentHeroProps {
  countryLabel: string;
  total: number;
  isLoaded: boolean;
  q: string;
  onQChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  aiBannerDismissed: boolean;
  onDismissAiBanner: () => void;
}

export function AgentHero({
  countryLabel,
  total,
  isLoaded,
  q,
  onQChange,
  onSearch,
  aiBannerDismissed,
  onDismissAiBanner,
}: AgentHeroProps): React.ReactElement {
  return (
    <div className="bg-gradient-to-b from-teal-50 via-white to-white border-b border-slate-100 py-12 px-4 text-center">
      <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
        Find an agent in{" "}
        <span className="text-teal-600">{countryLabel}</span>
      </h1>

      <p className="text-slate-500 text-sm mb-1 max-w-md mx-auto">
        Browse verified agents and connect directly via email, call, or WhatsApp.
      </p>

      {/* Live stat line — shown once data loads and there are results */}
      {isLoaded && total > 0 && (
        <p className="text-teal-700 text-xs font-semibold mb-6">
          {total.toLocaleString()} verified agent{total !== 1 ? "s" : ""} across{" "}
          {countryLabel}
        </p>
      )}
      {(!isLoaded || total === 0) && <div className="mb-6" />}

      {/* AI coming-soon hint — dismissible */}
      {!aiBannerDismissed && (
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-800 max-w-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-left">
            Soon: ask in plain English —{" "}
            <em>
              &lsquo;find me an agent who speaks Arabic and sells off-plan in
              Marina&rsquo;
            </em>
          </span>
          <span className="shrink-0 rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-300/50">
            Coming soon
          </span>
          <button
            type="button"
            aria-label="Dismiss AI search teaser"
            onClick={onDismissAiBanner}
            className="shrink-0 text-amber-500 hover:text-amber-700 ml-1 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search input */}
      <form
        onSubmit={onSearch}
        className="mx-auto flex max-w-lg items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </form>
    </div>
  );
}
