"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { MarketplaceStats } from "@fh/portal-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HeroTab = "buy" | "rent" | "offplan" | "commercial";

interface HeroSectionProps {
  brandName: string;
  locationLabel: string;
  stats: MarketplaceStats | undefined;
  countryCode: string | null;
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: { id: HeroTab; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "rent", label: "Rent" },
  { id: "offplan", label: "Off-Plan" },
  { id: "commercial", label: "Commercial" },
];

const COMMERCIAL_TYPES = "office,retail,warehouse";

// ---------------------------------------------------------------------------
// Hero stat definitions
// ---------------------------------------------------------------------------

interface StatDef {
  key: string;
  value: (s: MarketplaceStats | undefined, countryCount: number) => string;
  label: string;
}

const STAT_DEFS: StatDef[] = [
  {
    key: "listings",
    value: (s) =>
      s ? `${s.total_listings.toLocaleString()}+` : "—",
    label: "Active Listings",
  },
  {
    key: "countries",
    // TODO: wire to real country count when API exposes it
    value: (_s, cc) => (cc > 0 ? `${cc}` : "6"),
    label: "GCC Countries",
  },
  {
    key: "agents",
    // TODO: replace placeholder when API exposes agent count
    value: () => "3,200+",
    label: "Verified Agents",
  },
  {
    key: "transactions",
    // TODO: replace placeholder when API exposes transaction volume
    value: () => "AED 2.4B+",
    label: "Transactions 2025",
  },
];

// ---------------------------------------------------------------------------
// HeroSection
// ---------------------------------------------------------------------------

export function HeroSection({
  brandName,
  locationLabel,
  stats,
  countryCode,
}: HeroSectionProps): React.ReactElement {
  const router = useRouter();
  const [tab, setTab] = useState<HeroTab>("buy");
  const [q, setQ] = useState("");

  // Derive country count from stats context (passed from page)
  // We don't have a direct count; the fallback constant 6 covers GCC
  const countryCount = 0; // page passes 0 to use default "6"

  function buildSearchUrl(): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (countryCode) params.set("country", countryCode);

    switch (tab) {
      case "buy":
        params.set("purpose", "sale");
        break;
      case "rent":
        params.set("purpose", "rent_long");
        break;
      case "offplan":
        params.set("purpose", "sale");
        params.set("completion_status", "off_plan");
        break;
      case "commercial":
        params.set("property_type", COMMERCIAL_TYPES);
        break;
    }
    return `/listings?${params.toString()}`;
  }

  function handleSearch(e: React.FormEvent): void {
    e.preventDefault();
    router.push(buildSearchUrl());
  }

  return (
    <section
      className="relative overflow-hidden py-24 px-4"
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #0369A1 100%)",
      }}
    >
      {/* Floating animated blobs */}
      <Blob className="top-[-80px] left-[-80px] h-96 w-96 bg-blue-600 opacity-20" />
      <Blob className="bottom-[-60px] right-[-60px] h-80 w-80 bg-teal-500 opacity-20" />
      <Blob className="top-[30%] left-[60%] h-64 w-64 bg-indigo-500 opacity-10" />

      <div className="relative mx-auto max-w-3xl text-center space-y-8">
        {/* Trust badge */}
        <TrustBadge />

        {/* H1 */}
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
          Discover your{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #60A5FA, #34D399, #F97316)",
            }}
          >
            Dream Property
          </span>
          <br />
          <span className="text-slate-300 text-3xl md:text-4xl font-bold">
            in {locationLabel}
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
          Browse verified listings on {brandName} — buy, rent, or invest
          across the GCC&apos;s most trusted property marketplace.
        </p>

        {/* Tabbed search */}
        <SearchPanel
          tab={tab}
          setTab={setTab}
          q={q}
          setQ={setQ}
          onSearch={handleSearch}
        />

        {/* Stats bar */}
        <StatsBar stats={stats} countryCount={countryCount} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Blob({ className }: { className: string }): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    />
  );
}

function TrustBadge(): React.ReactElement {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
        </span>
        <span className="text-xs font-semibold text-white/90 tracking-wide">
          #1 Real Estate Platform in UAE &amp; GCC
        </span>
      </div>
    </div>
  );
}

interface SearchPanelProps {
  tab: HeroTab;
  setTab: (t: HeroTab) => void;
  q: string;
  setQ: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

function SearchPanel({
  tab,
  setTab,
  q,
  setQ,
  onSearch,
}: SearchPanelProps): React.ReactElement {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 space-y-3">
      {/* Tab row */}
      <div className="flex gap-1 bg-white/10 rounded-xl p-1 w-fit mx-auto">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              tab === id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input row */}
      <form
        onSubmit={onSearch}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="City, community, or keyword…"
          className="flex-1 rounded-xl bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-6 py-3 text-sm font-bold text-white transition-colors shadow-lg shadow-teal-900/30"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </form>
    </div>
  );
}

function StatsBar({
  stats,
  countryCount,
}: {
  stats: MarketplaceStats | undefined;
  countryCount: number;
}): React.ReactElement {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
      {STAT_DEFS.map(({ key, value, label }) => (
        <div key={key} className="text-center">
          <p className="text-xl md:text-2xl font-black text-white">
            {value(stats, countryCount)}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
