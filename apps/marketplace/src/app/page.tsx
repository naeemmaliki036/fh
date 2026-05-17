"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { useMarketplaceStats } from "@/hooks/queries/useMarketplaceStats";
import { useMarketplaceFeatured } from "@/hooks/queries/useMarketplaceFeatured";
import { useMarketplaceAgencies } from "@/hooks/queries/useMarketplaceAgencies";
import { MarketplaceListingCard } from "@/components/MarketplaceListingCard";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { HeroSection } from "@/components/HeroSection";
import { PropertyTypeGrid } from "@/components/PropertyTypeGrid";
import { useCountry } from "@/lib/country-context";
import { lookupCountry } from "@/lib/country-meta";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";

const FALLBACK_TYPES = [
  "apartment", "villa", "townhouse", "penthouse", "land", "office",
] as const;

export default function MarketplaceHomePage(): React.ReactElement {
  const { country } = useCountry();

  const { data: stats } = useMarketplaceStats(country ?? undefined);
  const { data: featured = [] } = useMarketplaceFeatured(country ?? undefined);
  const { data: agenciesData } = useMarketplaceAgencies(1, 12, undefined, country ?? undefined);
  const { data: countriesData } = useMarketplaceCountries();
  const agencies = agenciesData?.items ?? [];

  const countryMeta = lookupCountry(country, countriesData?.countries);
  const locationLabel =
    country && countryMeta.name
      ? `${countryMeta.flag} ${countryMeta.name}`
      : "worldwide";

  const heroImageUrl =
    country && countriesData?.countries
      ? (countriesData.countries.find((c) => c.code === country)?.hero_image_url ?? null)
      : null;

  const typeList =
    stats && stats.by_type.length > 0
      ? stats.by_type
      : FALLBACK_TYPES.map((pt) => ({ property_type: pt, count: 0 }));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        {/* Dark navy hero — stands apart from the rest of the light page */}
        <HeroSection
          brandName={PORTAL_BRAND_NAME}
          locationLabel={locationLabel}
          stats={stats}
          countryCode={country}
          heroImageUrl={heroImageUrl}
        />

        {/* Thin teal banner belt kept below hero */}
        {stats && (
          <section className="bg-teal-600 py-3.5 px-4">
            <p className="text-center text-sm font-bold text-white">
              {PORTAL_BRAND_NAME}: {stats.total_listings.toLocaleString()}{" "}
              {stats.total_listings === 1 ? "listing" : "listings"} in{" "}
              {locationLabel}
            </p>
          </section>
        )}

        <div className="mx-auto w-[min(100%-32px,1280px)] py-16 space-y-20">
          {/* Property type icon grid — replaces old chip strip */}
          <PropertyTypeGrid byType={typeList} country={country} />

          {featured.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  Hot properties
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
