"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { AgentCard } from "@/components/AgentCard";
import { useMarketplaceAgents } from "@/hooks/queries/useMarketplaceAgents";
import { useCountry } from "@/lib/country-context";
import { lookupCountry } from "@/lib/country-meta";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 24;

export default function AgentsPage(): React.ReactElement {
  const { country } = useCountry();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
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
  const totalPages = data ? Math.ceil(total / PAGE_SIZE) : 1;

  function handleSearch(e: React.FormEvent): void {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />

      <main className="flex-1">
        {/* Page header */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 py-14 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Find an agent in {countryLabel}
          </h1>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
            Browse verified agents and connect directly via email, call, or WhatsApp.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mx-auto flex max-w-lg items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search by name…"
                className="w-full rounded-full bg-white pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </form>
        </div>

        <div className="mx-auto w-[min(100%-32px,1280px)] py-10">
          {/* Result count */}
          {!isLoading && !isError && (
            <p className="text-sm text-slate-500 mb-6">
              <span className="font-bold text-slate-800">{total.toLocaleString()}</span>{" "}
              agent{total !== 1 ? "s" : ""} found
            </p>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading agents…
            </div>
          )}

          {isError && (
            <p className="py-10 text-center text-sm text-red-500">
              Failed to load agents. Please try again.
            </p>
          )}

          {!isLoading && !isError && agents.length === 0 && (
            <div className="py-24 text-center text-slate-400">
              <p className="text-base font-semibold">No agents found</p>
              <p className="text-sm mt-1">Try a different search or country</p>
            </div>
          )}

          {!isLoading && !isError && agents.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:border-teal-400 hover:text-teal-700 transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:border-teal-400 hover:text-teal-700 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
