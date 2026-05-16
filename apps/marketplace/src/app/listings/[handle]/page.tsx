"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { useMarketplaceListing } from "@/hooks/queries/useMarketplaceListing";
import { MarketplaceLeadForm } from "@/components/MarketplaceLeadForm";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";

interface PageProps {
  params: Promise<{ handle: string }>;
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}): React.ReactElement {
  if (value == null) return <></>;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-base font-black text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

export default function ListingDetailPage({ params }: PageProps): React.ReactElement {
  const { handle } = use(params);
  const { data: listing, isLoading, isError } = useMarketplaceListing(handle);
  const [imgIdx, setImgIdx] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-400 text-sm">
          Loading...
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center py-20 text-red-500 text-sm">
          Listing not found.
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  const mediaUrls = listing.media_urls ?? [];
  const heroUrl = listing.hero_media_url ?? mediaUrls[0] ?? null;
  const allImages = heroUrl
    ? [heroUrl, ...mediaUrls.filter((u) => u !== heroUrl)]
    : mediaUrls;

  const priceFormatted = `${listing.currency} ${listing.price.toLocaleString("en-AE")}`;
  const purpose = listing.purpose === "sale" ? "For Sale" : "For Rent";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        <div className="mx-auto w-[min(100%-24px,1200px)] py-8 space-y-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to listings
          </Link>

          {allImages.length > 0 && (
            <div className="space-y-2">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={allImages[imgIdx]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((url, i) => (
                    <button
                      key={url}
                      onClick={() => setImgIdx(i)}
                      className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                        i === imgIdx ? "border-blue-500" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    {listing.is_verified && (
                      <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 mb-2">
                        Verified
                      </span>
                    )}
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">
                      {listing.title}
                    </h1>
                    {listing.internal_reference && (
                      <p className="text-xs text-slate-400 mt-1">
                        Ref: {listing.internal_reference}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{priceFormatted}</p>
                    <p className="text-xs text-slate-500">{purpose}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {[listing.area, listing.city].filter(Boolean).join(", ") || "Location TBC"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label="Bedrooms" value={listing.beds} />
                <StatTile label="Bathrooms" value={listing.baths} />
                <StatTile
                  label="Area"
                  value={
                    listing.area_sqft
                      ? `${listing.area_sqft.toLocaleString()} sqft`
                      : null
                  }
                />
                <StatTile label="Build Year" value={listing.build_year} />
                {listing.price_per_sqft != null && (
                  <StatTile
                    label="Price/sqft"
                    value={`${listing.currency} ${listing.price_per_sqft.toLocaleString()}`}
                  />
                )}
              </div>

              {listing.description && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-2">Description</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              )}

              {listing.floor_plan_urls.length > 0 && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-2">Floor Plans</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.floor_plan_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Floor plan ${i + 1}`}
                        className="rounded-xl border border-slate-200 w-full object-contain bg-white"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <p className="text-xs text-slate-400">Map view coming soon</p>
                {listing.lat != null && listing.lng != null && (
                  <p className="text-xs text-slate-500 mt-1">
                    {listing.lat}, {listing.lng}
                  </p>
                )}
              </div>

              {listing.upcoming_open_houses.length > 0 && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-2">Open Houses</h2>
                  <ul className="space-y-2">
                    {listing.upcoming_open_houses.map((oh, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600 rounded-lg border border-slate-200 bg-white px-4 py-2.5"
                      >
                        <CalendarDays className="h-4 w-4 text-blue-500 shrink-0" />
                        {new Date(oh.starts_at).toLocaleDateString("en-AE", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {oh.capacity != null && (
                          <span className="ml-auto text-xs text-slate-400">
                            {oh.capacity} spots
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <MarketplaceLeadForm
                  tenantSlug={listing.tenant.slug}
                  listingId={listing.id}
                />
              </div>

              {listing.agent_name && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                  {listing.agent_photo_url ? (
                    <img
                      src={listing.agent_photo_url}
                      alt={listing.agent_name}
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                      {listing.agent_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{listing.agent_name}</p>
                    {listing.agent_has_license && (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        RERA Licensed
                      </span>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {listing.tenant.logo_url && (
                <img
                  src={listing.tenant.logo_url}
                  alt={listing.tenant.name}
                  className="h-14 w-14 rounded-xl object-contain border border-slate-100 shrink-0"
                />
              )}
              <div>
                <p className="font-black text-slate-900">{listing.tenant.name}</p>
                {listing.tenant.tagline && (
                  <p className="text-xs text-slate-500">{listing.tenant.tagline}</p>
                )}
              </div>
            </div>
            <Link
              href={`/agencies/${listing.tenant.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-900 transition"
            >
              More from this agency <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
}
