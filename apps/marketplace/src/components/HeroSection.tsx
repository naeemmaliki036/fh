"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Flame } from "lucide-react";
import type { MarketplaceStats, MarketplaceCountryItem } from "@fh/portal-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HeroTab = "buy" | "rent" | "offplan" | "commercial";

interface HeroSectionProps {
  brandName: string;
  locationLabel: string;
  stats: MarketplaceStats | undefined;
  countryCode: string | null;
  heroImageUrl?: string | null;
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
    value: (s) => (s ? `${s.total_listings.toLocaleString()}+` : "—"),
    label: "Active Listings",
  },
  {
    key: "countries",
    value: (_s, cc) => (cc > 0 ? `${cc}` : "6"),
    label: "GCC Countries",
  },
  {
    key: "agents",
    value: () => "3,200+",
    label: "Verified Agents",
  },
  {
    key: "transactions",
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
  heroImageUrl,
}: HeroSectionProps): React.ReactElement {
  const router = useRouter();
  const [tab, setTab] = useState<HeroTab>("buy");
  const [q, setQ] = useState("");

  const countryCount = 0;

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

  // Generic fallback: stable GCC-coastal skyline photo so countries without
  // an admin-set hero_image_url still show a banner instead of a flat gradient.
  const GENERIC_HERO =
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=2200&auto=format&fit=crop&q=80";
  const bg = heroImageUrl || GENERIC_HERO;
  const sectionStyle: React.CSSProperties = {
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <section className="relative overflow-hidden py-24 px-4" style={sectionStyle}>
      {/* Gradient overlay — always rendered; replaces blobs when photo is set */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-900/85"
      />


      <div className="relative mx-auto max-w-3xl text-center space-y-8">
        {/* Trust badge */}
        <TrustBadge />

        {/* H1 */}
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
          Find your next{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, #60A5FA, #34D399, #F97316)",
            }}
          >
            home
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


function TrustBadge(): React.ReactElement {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
          <Flame className="relative h-3.5 w-3.5 text-orange-400" />
        </span>
        <span className="text-xs font-semibold text-white/90 tracking-wide">
          Hot Real Estate Platform in UAE &amp; GCC
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
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2">
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

// Re-export helper type so page.tsx can use it without importing portal-types directly
export type { MarketplaceCountryItem };
