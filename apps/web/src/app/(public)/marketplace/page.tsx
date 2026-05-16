"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Building2, ArrowRight } from "lucide-react";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { useMarketplaceStats } from "@/hooks/queries/marketplace/useMarketplaceStats";
import { useMarketplaceFeatured } from "@/hooks/queries/marketplace/useMarketplaceFeatured";
import { useMarketplaceAgencies } from "@/hooks/queries/marketplace/useMarketplaceAgencies";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";

const PROPERTY_TYPES = [
  "apartment", "villa", "townhouse", "penthouse", "land", "office",
];

export default function MarketplaceHomePage(): React.ReactElement {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState<"sale" | "rent_long">("sale");

  const { data: stats } = useMarketplaceStats();
  const { data: featured = [] } = useMarketplaceFeatured();
  const { data: agenciesData } = useMarketplaceAgencies(1, 12);
  const agencies = agenciesData?.items ?? [];

  function handleSearch(e: React.FormEvent): void {
    e.preventDefault();
    const params = new URLSearchParams({ purpose, ...(q ? { q } : {}) });
    router.push(`/marketplace/listings?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-amber-400" />
            <h1 className="text-4xl md:text-5xl font-black">{PORTAL_BRAND_NAME}</h1>
          </div>
          <p className="text-slate-300 text-lg">Search properties across the UAE&apos;s leading agencies</p>

          {/* Buy / Rent toggle */}
          <div className="inline-flex rounded-xl border border-slate-700 p-1 bg-slate-800">
            {(["sale", "rent_long"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPurpose(p)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition ${purpose === p ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:text-white"}`}
              >
                {p === "sale" ? "Buy" : "Rent"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="City, community, or keyword..."
              className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3.5 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-400 px-5 py-3.5 text-slate-900 font-black hover:bg-amber-300 transition"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>

      {/* Stats banner */}
      {stats && (
        <section className="bg-amber-400 py-3 px-4">
          <p className="text-center text-sm font-black text-slate-900">
            {PORTAL_BRAND_NAME}: {stats.total_listings.toLocaleString()} listings across {stats.total_agencies} agencies
          </p>
        </section>
      )}

      <div className="mx-auto w-[min(100%-32px,1280px)] py-12 space-y-14">
        {/* Type chips */}
        {stats && stats.by_type.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-slate-900 mb-4">Browse by type</h2>
            <div className="flex flex-wrap gap-2">
              {stats.by_type.map(({ property_type, count }) => (
                <Link
                  key={property_type}
                  href={`/marketplace/listings?property_type=${property_type}`}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                >
                  <span className="capitalize">{property_type.replace("_", " ")}</span>
                  <span className="text-slate-400 text-xs">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Property type browse (static chips for discovery) */}
        {(!stats || stats.by_type.length === 0) && (
          <section>
            <h2 className="text-lg font-black text-slate-900 mb-4">Browse by type</h2>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((pt) => (
                <Link
                  key={pt}
                  href={`/marketplace/listings?property_type=${pt}`}
                  className="inline-flex rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 transition capitalize"
                >
                  {pt.replace("_", " ")}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured listings */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Verified properties</h2>
              <Link href="/marketplace/listings?is_verified=true" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {featured.slice(0, 6).map((l) => (
                <MarketplaceListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* Trusted agencies */}
        {agencies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Trusted agencies</h2>
              <Link href="/marketplace/agencies" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                All agencies <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {agencies.map((agency) => (
                <Link
                  key={agency.id}
                  href={`/marketplace/agencies/${agency.slug}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-400 transition"
                >
                  {agency.logo_url ? (
                    <img src={agency.logo_url} alt={agency.name} className="h-12 w-12 rounded object-contain" />
                  ) : (
                    <span className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                      {agency.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-700 text-center leading-tight line-clamp-2">{agency.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
