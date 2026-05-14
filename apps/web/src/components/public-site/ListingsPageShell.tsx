"use client";

import { useState } from "react";
import type { PublicTenantProfile, PublicListingsParams, ResolvedSiteConfig } from "@/lib/types/public-site";
import { resolveConfig } from "@/lib/utils/resolve-site-config";
import { usePublicSiteListings } from "@/hooks/queries/public-site/usePublicSite";
import { HeroSection } from "./HeroSection";
import { ServicesGrid } from "./ServicesGrid";
import { ListingFilters } from "./ListingFilters";
import { ListingsGrid } from "./ListingsGrid";
import { PublicListingsSearchBar } from "./PublicListingsSearchBar";

interface ListingsPageShellProps {
  profile: PublicTenantProfile;
  slug: string;
}

export function ListingsPageShell({ profile, slug }: ListingsPageShellProps): React.ReactElement {
  const [filterParams, setFilterParams] = useState<PublicListingsParams>({ page: 1, page_size: 12 });
  const [activeType, setActiveType] = useState("");

  const cfg: ResolvedSiteConfig = resolveConfig(profile.config);

  const { data, isLoading } = usePublicSiteListings(slug, filterParams);

  const totalPages = data ? Math.ceil(data.total / (data.page_size || 12)) : 0;
  const currentPage = data?.page ?? 1;
  const firstListing = data?.items[0] ?? null;

  const handleSearch = (params: PublicListingsParams): void => {
    setFilterParams((prev) => ({ ...prev, ...params }));
  };

  const handleFilter = (params: PublicListingsParams): void => {
    setFilterParams((prev) => ({ ...prev, ...params }));
  };

  const goToPage = (page: number): void => {
    setFilterParams((prev) => ({ ...prev, page }));
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white">
      <HeroSection profile={profile} firstListing={firstListing} onSearch={handleSearch} cfg={cfg.hero} />

      {cfg.sections.services_enabled && <ServicesGrid cfg={cfg.services} />}

      {/* Listings section */}
      <section id="listings" className="py-14">
        <div className="mx-auto w-[min(100%-40px,1280px)]">
          <div className="mb-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                  Featured listings
                </span>
                <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  Properties worth exploring.
                </h2>
              </div>
              <ListingFilters
                activeType={activeType}
                onTypeChange={setActiveType}
                params={filterParams}
                onFilter={handleFilter}
              />
            </div>
            <PublicListingsSearchBar
              onFilter={handleFilter}
              operatingCountries={profile.operating_countries}
            />
          </div>

          {data && (
            <p className="mb-4 text-sm text-slate-500">
              {data.total} {data.total === 1 ? "property" : "properties"} found
            </p>
          )}

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-[2rem] bg-white shadow-sm" />
              ))}
            </div>
          ) : (
            <ListingsGrid listings={data?.items ?? []} slug={slug} />
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition ${
                    page === currentPage
                      ? "text-white"
                      : "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
                  }`}
                  style={page === currentPage ? { backgroundColor: "var(--primary)" } : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
