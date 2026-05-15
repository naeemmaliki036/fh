"use client";

import { useState } from "react";
import type { PublicTenantProfile, PublicListingItem, PublicListingsParams, HeroConfig } from "@/lib/types/public-site";
import { StatsRow } from "./StatsRow";

interface HeroSectionProps {
  profile: PublicTenantProfile;
  firstListing: PublicListingItem | null;
  onSearch: (params: PublicListingsParams) => void;
  cfg: HeroConfig;
}

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80";

export function HeroSection({ profile, firstListing, onSearch, cfg }: HeroSectionProps): React.ReactElement {
  const [area, setArea] = useState("");
  const [purpose, setPurpose] = useState("");

  const heroImage = cfg.image_url ?? firstListing?.primary_photo_url ?? FALLBACK_HERO;
  const featuredArea = profile.stats?.featured_area ?? "UAE";
  const eyebrow = cfg.eyebrow ?? `Verified properties in ${featuredArea}`;
  const headline = cfg.headline ?? profile.tagline ?? "Find a home worth coming back to.";
  const subheadline = cfg.subheadline ?? "Curated listings and a smooth process, end to end.";

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    const purposeParam = purpose === "buy" ? "sale" : purpose === "rent" ? "rent" : null;
    onSearch({ page: 1, property_type: null, ...(purposeParam ? {} : {}) });
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <div className="relative mx-auto grid w-[min(100%-40px,1280px)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <div className="inline-flex rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm">
            {eyebrow}
          </div>

          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-slate-950 md:text-7xl">
            {headline}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {subheadline}
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 grid gap-3 rounded-[2rem] border border-white bg-white/90 p-3 md:grid-cols-[1fr_180px_auto]"
            style={{ boxShadow: "0 24px 80px rgba(15,23,42,0.12)" }}
          >
            <label className="grid gap-1 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-xs font-black uppercase text-slate-500">Area</span>
              <input
                placeholder="Community or area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="border-0 bg-transparent text-slate-950 outline-none"
              />
            </label>
            <label className="grid gap-1 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-xs font-black uppercase text-slate-500">Purpose</span>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="border-0 bg-transparent text-slate-950 outline-none"
              >
                <option value="">All</option>
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Search
            </button>
          </form>

          <StatsRow profile={profile} />
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-900/20">
          <img
            src={heroImage}
            alt="Property"
            className="h-[560px] w-full object-cover sm:h-[420px] lg:h-[560px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 z-10 rounded-[2rem] bg-white/90 p-5 shadow-xl backdrop-blur">
            <span className="text-sm text-slate-500">Featured community</span>
            <strong className="mt-1 block text-2xl font-black">{featuredArea}</strong>
            <p className="mt-2 text-sm text-slate-500">Villas, townhouses, and premium apartments</p>
          </div>
        </div>
      </div>
    </section>
  );
}
