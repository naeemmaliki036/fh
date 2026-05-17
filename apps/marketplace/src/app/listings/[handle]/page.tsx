"use client";

import { use } from "react";
import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  ChevronLeft,
  ArrowRight,
  Loader2,
  BedDouble,
  Bath,
  Maximize2,
  Building2,
  ShieldCheck,
  Clock,
  Home,
} from "lucide-react";
import { useMarketplaceListing } from "@/hooks/queries/useMarketplaceListing";
import { useCountry } from "@/lib/country-context";
import { MarketplaceLeadForm } from "@/components/MarketplaceLeadForm";
import { ConsumerInquiryForm } from "@/components/ConsumerInquiryForm";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { SimilarListings } from "@/components/SimilarListings";
import { ListingGallery } from "./ListingGallery";
import { ListingDetailsTable } from "./ListingDetailsTable";
import { ListingAgentCard } from "./ListingAgentCard";
import { ListingLocationSection } from "./ListingLocationSection";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import type { MarketplaceListingDetail } from "@fh/portal-types";

interface PageProps {
  params: Promise<{ handle: string }>;
}

function daysAgo(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export default function ListingDetailPage({ params }: PageProps): React.ReactElement {
  const { handle } = use(params);
  const { data: listing, isLoading, isError } = useMarketplaceListing(handle);
  const { country, setCountry } = useCountry();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-400 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center py-20 text-red-500 text-sm">
          Listing not found.
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  // Deep-link country inference: if no country selected, try to infer from listing
  if (!country) {
    const inferred = listing.tenant.slug ? null : null; // slug-level inference not available
    // Best-effort: check operating_countries on agency (not in snippet — skip)
    // Fall back to showing gate (CountryGateModal handles it)
    void inferred;
  }

  const mediaUrls = listing.media_urls ?? [];
  const heroUrl = listing.hero_media_url ?? mediaUrls[0] ?? null;
  const allImages = heroUrl
    ? [heroUrl, ...mediaUrls.filter((u) => u !== heroUrl)]
    : mediaUrls;

  const priceFormatted = `${listing.currency} ${listing.price.toLocaleString("en-AE")}`;
  const purposeLabel =
    listing.purpose === "sale"
      ? "For Sale"
      : listing.purpose === "rent_long"
        ? "For Rent / Yearly"
        : "For Rent";
  const locationStr =
    [listing.area, listing.city].filter(Boolean).join(", ") || "Location TBC";

  const isOffPlan = listing.completion_status === "off_plan";
  const isSale = listing.purpose === "sale";
  const postedDays = daysAgo(listing.created_at);
  const amenities = listing.amenities ?? [];
  const isConsumerListing =
    (listing as MarketplaceListingDetail & { is_consumer_listing?: boolean })
      .is_consumer_listing === true;
  const ownerDisplayName =
    (listing as MarketplaceListingDetail & { owner_display_name?: string })
      .owner_display_name ?? "Owner";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        <div className="mx-auto w-[min(100%-24px,1200px)] py-10 space-y-10">
          <Link
            href="/listings"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back to listings
          </Link>

          {/* Gallery */}
          <ListingGallery allImages={allImages} title={listing.title} />

          {/* Headline strip */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  <span className="rounded-full bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 capitalize">
                    {listing.property_type.replace(/_/g, " ")}
                  </span>
                  {isConsumerListing && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5">
                      <Home className="h-3 w-3" /> Listed by {ownerDisplayName}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  {listing.title}
                </h1>
                {listing.internal_reference && (
                  <p className="text-xs text-slate-400">Ref: {listing.internal_reference}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black text-slate-900">{priceFormatted}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{purposeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0 text-teal-500" />
              <span>{locationStr}</span>
            </div>
          </div>

          {/* Trust signals */}
          {(postedDays != null || listing.is_verified) && (
            <div className="flex flex-wrap gap-3">
              {postedDays != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Clock className="h-3.5 w-3.5" />
                  Listed {postedDays === 0 ? "today" : `${postedDays} days ago`}
                </span>
              )}
              {listing.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified by {PORTAL_BRAND_NAME}
                  {listing.verified_at && (
                    <span className="text-amber-500">
                      {" "}on {new Date(listing.verified_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Left column */}
            <div className="space-y-8">
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {listing.beds != null && (
                  <QuickStat icon={<BedDouble className="h-5 w-5 text-teal-500" />} label="Bedrooms" value={String(listing.beds)} />
                )}
                {listing.baths != null && (
                  <QuickStat icon={<Bath className="h-5 w-5 text-teal-500" />} label="Bathrooms" value={String(listing.baths)} />
                )}
                {listing.area_sqft != null && (
                  <QuickStat icon={<Maximize2 className="h-5 w-5 text-teal-500" />} label="Area" value={`${listing.area_sqft.toLocaleString()} sqft`} />
                )}
                {listing.property_type && (
                  <QuickStat icon={<Building2 className="h-5 w-5 text-teal-500" />} label="Type" value={listing.property_type.replace(/_/g, " ")} />
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-2">Description</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Property details table */}
              <ListingDetailsTable listing={listing} />

              {/* Off-plan section */}
              {isOffPlan && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 space-y-2">
                  <h2 className="text-base font-black text-amber-800">Off-Plan</h2>
                  {listing.handover_year && (
                    <p className="text-sm font-semibold text-amber-700">
                      Handover:{" "}
                      {listing.handover_quarter
                        ? `Q${listing.handover_quarter} ${listing.handover_year}`
                        : listing.handover_year}
                    </p>
                  )}
                  {listing.payment_plan && (
                    <span className="inline-block rounded-full bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1">
                      Payment plan available
                    </span>
                  )}
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 capitalize"
                      >
                        {typeof a === "string" ? a.replace(/_/g, " ") : String(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Floor plans */}
              {listing.floor_plan_urls.length > 0 && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-3">Floor Plans</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.floor_plan_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Floor plan ${i + 1}`}
                        className="rounded-2xl border border-slate-100 w-full object-contain bg-white"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <ListingLocationSection listing={listing} />

              {/* Open houses */}
              {listing.upcoming_open_houses.length > 0 && (
                <div>
                  <h2 className="text-base font-black text-slate-900 mb-2">Open Houses</h2>
                  <ul className="space-y-2">
                    {listing.upcoming_open_houses.map((oh, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600 rounded-xl border border-slate-100 bg-white px-4 py-2.5"
                      >
                        <CalendarDays className="h-4 w-4 text-teal-500 shrink-0" />
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

              {/* TODO: Building / project info — not in current schema */}
            </div>

            {/* Right sidebar */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
                {isConsumerListing ? (
                  <ConsumerInquiryForm listingId={String(listing.id)} />
                ) : (
                  <MarketplaceLeadForm
                    tenantSlug={listing.tenant.slug}
                    listingId={String(listing.id)}
                  />
                )}
              </div>

              {!isConsumerListing && <ListingAgentCard listing={listing} />}

              {/* Mortgage calculator (sale only) */}
              {isSale && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
                  <h3 className="font-black text-slate-900 text-sm">Mortgage estimate</h3>
                  <MortgageCalculator price={listing.price} currency={listing.currency} />
                </div>
              )}
            </aside>
          </div>

          {/* Agency footer strip — hidden for consumer listings */}
          {!isConsumerListing && <div className="rounded-2xl border border-slate-100 bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {listing.tenant.logo_url && (
                <img
                  src={listing.tenant.logo_url}
                  alt={listing.tenant.name}
                  className="h-14 w-14 rounded-2xl object-contain border border-slate-100 shrink-0"
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
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-teal-400 hover:text-teal-600 transition"
            >
              More from this agency <ArrowRight className="h-4 w-4" />
            </Link>
          </div>}

          {/* Similar listings */}
          <SimilarListings
            currentId={String(listing.id)}
            propertyType={listing.property_type}
            country={country}
          />
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col items-center gap-2 text-center shadow-sm">
      {icon}
      <p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-black text-slate-900 capitalize">{value}</p>
    </div>
  );
}

function MortgageCalculator({
  price,
  currency,
}: {
  price: number;
  currency: string;
}): React.ReactElement {
  const down = Math.round(price * 0.2);
  const loan = price - down;
  const rate = 0.045;
  const n = 25 * 12;
  const monthly = Math.round((loan * (rate / 12)) / (1 - Math.pow(1 + rate / 12, -n)));

  return (
    <div className="space-y-2 text-xs text-slate-600">
      <div className="flex justify-between">
        <span>Down payment (20%)</span>
        <span className="font-bold text-slate-900">
          {currency} {down.toLocaleString("en-AE")}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Loan amount</span>
        <span className="font-bold text-slate-900">
          {currency} {loan.toLocaleString("en-AE")}
        </span>
      </div>
      <div className="flex justify-between pt-1 border-t border-slate-100">
        <span className="font-semibold">Est. monthly (4.5%, 25yr)</span>
        <span className="font-black text-teal-600">
          {currency} {monthly.toLocaleString("en-AE")}
        </span>
      </div>
      <p className="text-[10px] text-slate-400">Illustrative estimate only.</p>
    </div>
  );
}
