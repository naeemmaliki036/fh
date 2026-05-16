"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { useMarketplaceStats } from "@/hooks/queries/useMarketplaceStats";
import { useMarketplaceFeatured } from "@/hooks/queries/useMarketplaceFeatured";
import { useMarketplaceAgencies } from "@/hooks/queries/useMarketplaceAgencies";
import { MarketplaceListingCard } from "@/components/MarketplaceListingCard";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { useCountry } from "@/lib/country-context";
import { getCountryMeta } from "@/lib/country-meta";

const PROPERTY_TYPES = [
  "apartment", "villa", "townhouse", "penthouse", "land", "office",
] as const;

export default function MarketplaceHomePage(): React.ReactElement {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState<"sale" | "rent_long">("sale");
  const { country } = useCountry();

  const { data: stats } = useMarketplaceStats(country ?? undefined);
  const { data: featured = [] } = useMarketplaceFeatured(country ?? undefined);
  const { data: agenciesData } = useMarketplaceAgencies(1, 12, undefined, country ?? undefined);
  const agencies = agenciesData?.items ?? [];

  function handleSearch(e: React.FormEvent): void {
    e.preventDefault();
    const params = new URLSearchParams({ purpose, ...(q ? { q } : {}) });
    if (country) params.set("country", country);
    router.push(`/listings?${params.toString()}`);
  }

  const typeList =
    stats && stats.by_type.length > 0
      ? stats.by_type
      : PROPERTY_TYPES.map((pt) => ({ property_type: pt, count: 0 }));

  const countryMeta = country ? getCountryMeta(country) : null;
  const locationLabel = countryMeta
    ? `${countryMeta.flag} ${countryMeta.name}`
    : "worldwide";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        <HeroSection
          q={q}
          setQ={setQ}
          purpose={purpose}
          setPurpose={setPurpose}
          onSearch={handleSearch}
          brandName={PORTAL_BRAND_NAME}
          locationLabel={locationLabel}
        />

        {stats && (
          <section className="bg-teal-600 py-3.5 px-4">
            <p className="text-center text-sm font-bold text-white">
              {PORTAL_BRAND_NAME}: {stats.total_listings.toLocaleString()}{" "}
              {stats.total_listings === 1 ? "listing" : "listings"} in {locationLabel}
            </p>
          </section>
        )}

        <div className="mx-auto w-[min(100%-32px,1280px)] py-16 space-y-20">
          <section>
            <h2 className="text-xl font-black text-slate-900 mb-5">Browse by type</h2>
            <div className="flex flex-wrap gap-2.5">
              {typeList.map(({ property_type, count }) => (
                <Link
                  key={property_type}
                  href={`/listings?property_type=${property_type}${country ? `&country=${country}` : ""}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition capitalize"
                >
                  {property_type.replace(/_/g, " ")}
                  {count > 0 && (
                    <span className="text-xs text-slate-400">{count}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>

          {featured.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  Verified properties
                </h2>
                <Link
                  href={`/listings?is_verified=true${country ? `&country=${country}` : ""}`}
                  className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.slice(0, 6).map((l) => (
                  <MarketplaceListingCard key={l.id} listing={l} />
                ))}
              </div>
            </section>
          )}

          {agencies.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  Browse by partner
                </h2>
                <Link
                  href="/agencies"
                  className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  All partners <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {agencies.map((agency) => (
                  <Link
                    key={agency.id}
                    href={`/agencies/${agency.slug}`}
                    className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-4 hover:border-teal-200 hover:shadow-sm transition"
                  >
                    {agency.logo_url ? (
                      <img
                        src={agency.logo_url}
                        alt={agency.name}
                        className="h-12 w-12 rounded-xl object-contain"
                      />
                    ) : (
                      <span className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-sm font-bold text-teal-600">
                        {agency.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-700 text-center leading-tight line-clamp-2">
                      {agency.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
}

interface HeroSectionProps {
  q: string;
  setQ: (v: string) => void;
  purpose: "sale" | "rent_long";
  setPurpose: (v: "sale" | "rent_long") => void;
  onSearch: (e: React.FormEvent) => void;
  brandName: string;
  locationLabel: string;
}

function HeroSection({
  q,
  setQ,
  purpose,
  setPurpose,
  onSearch,
  brandName,
  locationLabel,
}: HeroSectionProps): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-amber-50 py-24 px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-teal-100 opacity-40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-amber-100 opacity-30 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">
            Open property marketplace
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight">
            Search properties in{" "}
            <span className="text-teal-600">{locationLabel}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Browse verified listings on {brandName}{" "}
            {locationLabel !== "worldwide" ? `in ${locationLabel}` : "worldwide"}
          </p>
        </div>

        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {(["sale", "rent_long"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPurpose(p)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition ${
                purpose === p
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {p === "sale" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>

        <form
          onSubmit={onSearch}
          className="flex gap-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-2"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="City, community, or keyword..."
            className="flex-1 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-6 py-3 text-white font-bold hover:bg-teal-700 transition flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>
      </div>
    </section>
  );
}
