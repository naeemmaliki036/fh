"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { useMarketplaceAgencies } from "@/hooks/queries/useMarketplaceAgencies";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";

const PAGE_SIZE = 24;

export default function AgenciesPage(): React.ReactElement {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMarketplaceAgencies(page, PAGE_SIZE, q || undefined);
  const agencies = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        <div className="mx-auto w-[min(100%-24px,1200px)] py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">All Agencies</h1>
            <p className="text-slate-500 text-sm mt-1">{total} agencies on the marketplace</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); }}
            className="flex gap-2 max-w-md"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search agencies..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {isLoading && (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          )}

          {!isLoading && agencies.length === 0 && (
            <p className="py-12 text-center text-slate-400">No agencies found.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {agencies.map((agency) => (
              <Link
                key={agency.id}
                href={`/agencies/${agency.slug}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition overflow-hidden"
              >
                <div className="h-20 bg-gradient-to-br from-slate-700 to-slate-900 relative overflow-hidden">
                  {agency.banner_url && (
                    <img
                      src={agency.banner_url}
                      alt=""
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                  {agency.logo_url && (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      className="absolute bottom-0 left-4 translate-y-1/2 h-12 w-12 rounded-xl border-2 border-white object-contain bg-white"
                    />
                  )}
                </div>
                <div className="pt-8 px-4 pb-4 space-y-1">
                  <p className="font-black text-slate-900 text-sm">{agency.name}</p>
                  {agency.tagline && (
                    <p className="text-xs text-slate-500 line-clamp-2">{agency.tagline}</p>
                  )}
                  <div className="flex gap-3 text-xs text-slate-400 pt-1">
                    <span>{agency.listings_count} listings</span>
                    <span>{agency.agents_count} agents</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
}
