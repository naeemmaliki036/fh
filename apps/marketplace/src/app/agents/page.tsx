"use client";

import { useState, useMemo } from "react";
import { Users } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { AgentCard } from "@/components/AgentCard";
import { AgentSkeletonCard } from "@/components/AgentSkeletonCard";
import { AgentHero } from "@/components/AgentHero";
import {
  AgentFilterBar,
  type AgentSort,
} from "@/components/AgentFilterBar";
import { useMarketplaceAgents } from "@/hooks/queries/useMarketplaceAgents";
import { useCountry } from "@/lib/country-context";
import { lookupCountry } from "@/lib/country-meta";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";
import { useDebounce } from "@/hooks/useDebounce";
import type { MarketplaceAgent } from "@fh/portal-types";

const PAGE_SIZE = 24;
const SKELETON_COUNT = 8;

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function AgentEmptyState({
  onReset,
}: {
  onReset: () => void;
}): React.ReactElement {
  return (
    <div className="py-24 flex flex-col items-center gap-3 text-center">
      <Users className="h-10 w-10 text-slate-300" />
      <p className="text-base font-bold text-slate-700">No agents found</p>
      <p className="text-sm text-slate-400 max-w-xs">
        Try a different search or choose another country.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 rounded-full border border-teal-300 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition"
      >
        Reset search
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}

function AgentPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
}: PaginationProps): React.ReactElement | null {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 mt-10 flex-wrap">
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{from}</span>
        {" – "}
        <span className="font-semibold text-slate-700">{to}</span>
        {" of "}
        <span className="font-semibold text-slate-700">
          {total.toLocaleString()}
        </span>
      </p>

      <div className="flex items-center gap-3">
        <button
          disabled={page <= 1}
          onClick={onPrev}
          className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:border-teal-400 hover:text-teal-700 transition"
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={onNext}
          className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:border-teal-400 hover:text-teal-700 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage(): React.ReactElement {
  const { country } = useCountry();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<AgentSort>("active");
  const [aiBannerDismissed, setAiBannerDismissed] = useState(false);
  const debouncedQ = useDebounce(q, 350);

  const { data: countriesData } = useMarketplaceCountries();
  const countryMeta = lookupCountry(country, countriesData?.countries);
  const countryLabel = countryMeta.name || country || "your region";

  const { data, isLoading, isError } = useMarketplaceAgents({
    country: country ?? undefined,
    q: debouncedQ || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const agents = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  // Client-side A-Z sort when selected — backend order is fixed
  // (most active listings → licensed first → alphabetical).
  const displayedAgents = useMemo<MarketplaceAgent[]>(() => {
    if (sort === "az") {
      return [...agents].sort((a, b) =>
        a.full_name.localeCompare(b.full_name),
      );
    }
    return agents;
  }, [agents, sort]);

  const hasActiveFilters = Boolean(debouncedQ) || sort !== "active";

  function handleSearch(e: React.FormEvent): void {
    e.preventDefault();
    setPage(1);
  }

  function handleQChange(v: string): void {
    setQ(v);
    setPage(1);
  }

  function handleReset(): void {
    setQ("");
    setSort("active");
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1">
        <AgentHero
          countryLabel={countryLabel}
          total={total}
          isLoaded={!isLoading && !isError}
          q={q}
          onQChange={handleQChange}
          onSearch={handleSearch}
          aiBannerDismissed={aiBannerDismissed}
          onDismissAiBanner={() => setAiBannerDismissed(true)}
        />

        <div className="mx-auto w-[min(100%-32px,1280px)] py-8">
          {/* Filter bar */}
          <div className="mb-6">
            <AgentFilterBar
              countryLabel={countryLabel}
              sort={sort}
              onSortChange={(s) => {
                setSort(s);
                setPage(1);
              }}
              hasActiveFilters={hasActiveFilters}
              onReset={handleReset}
            />
          </div>

          {/* Loading — skeleton grid */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <AgentSkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <p className="py-10 text-center text-sm text-red-500">
              Failed to load agents. Please try again.
            </p>
          )}

          {/* Empty */}
          {!isLoading && !isError && displayedAgents.length === 0 && (
            <AgentEmptyState onReset={handleReset} />
          )}

          {/* Agent grid */}
          {!isLoading && !isError && displayedAgents.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>

              <AgentPagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onPrev={() => setPage((p) => p - 1)}
                onNext={() => setPage((p) => p + 1)}
              />
            </>
          )}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
