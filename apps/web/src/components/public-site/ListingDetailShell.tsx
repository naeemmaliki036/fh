"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BedDouble, Bath, Square, Building2, MapPin } from "lucide-react";
import type { PublicListingDetail } from "@/lib/types/public-site";
import { AgentCard } from "./AgentCard";
import { ContactForm } from "./ContactForm";
import { ListingCard } from "./ListingCard";
import { formatAed } from "@/lib/utils/format-currency";
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge";
import { ReferenceBadge } from "@/components/atoms/ReferenceBadge";
import { PostedAgo } from "@/components/atoms/PostedAgo";
import { CheckoutCTAs } from "@/components/molecules/CheckoutCTAs";
import { useSimilarListings } from "@/hooks/queries/useSimilarListings";

interface ListingDetailShellProps {
  listing: PublicListingDetail;
  slug: string;
}

function purposeLabel(p: string): string {
  if (p === "sale") return "For Sale";
  if (p === "rent_short") return "Short-term Rental";
  return "For Rent";
}

interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}

/** Horizontal stat tile: [icon] value / label */
function StatTile({ icon: Icon, value, label }: StatTileProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-base font-black capitalize text-slate-950">{value}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function ListingDetailShell({ listing, slug }: ListingDetailShellProps): React.ReactElement {
  const amenities = Array.isArray(listing.amenities)
    ? listing.amenities.filter((a): a is string => typeof a === "string")
    : [];
  const urls = listing.media_urls;
  const [activeImage, setActiveImage] = useState(0);
  const { data: similarListings } = useSimilarListings(slug, listing.id, 4);

  const statCount =
    (listing.beds != null ? 1 : 0) + (listing.baths != null ? 1 : 0) + (listing.area_sqft != null ? 1 : 0) + 1;
  const gridCols = statCount >= 4 ? "sm:grid-cols-4" : statCount === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className="min-h-screen bg-white">
      {listing.status !== "active" && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900">
          Preview mode — this listing is in <strong>{listing.status.replace(/_/g, " ")}</strong> state and is not visible
          on the public listings index.
        </div>
      )}

      {/* Banner + overlaid summary widget */}
      <div className="relative">
        <div className="relative h-[420px] overflow-hidden bg-slate-900">
          {urls.length > 0 ? (
            <img
              src={urls[activeImage]}
              alt={listing.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 50%, #111827 100%)",
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

          {/* Back link */}
          <Link
            href={`/p/${slug}`}
            className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>

          {/* Title block */}
          <div className="absolute bottom-6 left-6 right-6 z-10 lg:right-[380px]">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
                {purposeLabel(listing.purpose)}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white ring-1 ring-white/20 backdrop-blur-sm">
                {listing.property_type.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">{listing.title}</h1>
            {listing.is_verified && <VerifiedBadge verifiedBy={listing.verified_by_user_name} />}
            {listing.address && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" /> {listing.address}
              </p>
            )}
            {listing.short_description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/80">{listing.short_description}</p>
            )}
          </div>

          {/* Side widget — desktop only */}
          <div className="absolute right-4 top-4 z-10 hidden w-[340px] rounded-2xl bg-white/95 p-5 shadow-lg backdrop-blur-sm lg:block">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Price</p>
            <p className="text-2xl font-black text-slate-950">{formatAed(listing.price)}</p>
            {listing.price_per_sqft != null && (
              <p className="text-xs text-slate-400 mt-0.5">AED {listing.price_per_sqft.toLocaleString()} / sqft</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <ReferenceBadge reference={listing.internal_reference} />
              <PostedAgo days={listing.days_since_posted} />
            </div>
            <div className="my-4 h-px bg-slate-100" />
            {listing.agent ? (
              <AgentCardCompact agent={listing.agent} />
            ) : (
              <ContactForm slug={slug} listingId={listing.id} compact />
            )}
            {listing.agent?.phone && (
              <div className="mt-3">
                <CheckoutCTAs agentPhone={listing.agent.phone} agentName={listing.agent.full_name} listingTitle={listing.title} />
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail strip below banner */}
        {urls.length > 1 && (
          <div className="flex gap-3 overflow-x-auto px-6 py-4">
            {urls.map((url, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  i === activeImage
                    ? "border-slate-950 ring-2 ring-slate-200"
                    : "border-slate-200 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={url} alt={`${listing.title} ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <header className="border-b border-slate-100 px-6 py-3">
        <div className="mx-auto w-[min(100%-0px,1280px)] flex items-center gap-2 text-sm text-slate-500">
          <Link href={`/p/${slug}`} className="hover:text-slate-900">
            Listings
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-slate-900">{listing.title}</span>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto w-[min(100%-40px,1280px)] py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Stat tiles — horizontal */}
            <div className={`grid grid-cols-2 gap-3 ${gridCols}`}>
              {listing.beds != null && <StatTile icon={BedDouble} value={listing.beds} label="Bedrooms" />}
              {listing.baths != null && <StatTile icon={Bath} value={listing.baths} label="Bathrooms" />}
              {listing.area_sqft != null && (
                <StatTile icon={Square} value={`${listing.area_sqft.toLocaleString()} sqft`} label="Area" />
              )}
              <StatTile icon={Building2} value={listing.property_type.replace(/_/g, " ")} label="Type" />
            </div>

            {/* Mobile price card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:hidden">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Price</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{formatAed(listing.price)}</p>
            </div>

            {/* Description */}
            {listing.description && (
              <section className="rounded-xl bg-slate-50 p-6">
                <h2 className="mb-3 text-base font-bold text-slate-950">About this property</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{listing.description}</p>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="rounded-xl bg-slate-50 p-6">
                <h2 className="mb-3 text-base font-bold text-slate-950">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Mobile: agent + contact form */}
            <div className="space-y-4 lg:hidden">
              {listing.agent && <AgentCard agent={listing.agent} />}
              {listing.agent?.phone && (
                <CheckoutCTAs agentPhone={listing.agent.phone} agentName={listing.agent.full_name} listingTitle={listing.title} />
              )}
              <ContactForm slug={slug} listingId={listing.id} compact />
            </div>

            {/* Similar listings */}
            {similarListings && similarListings.length > 0 && (
              <section className="pt-4">
                <h2 className="mb-4 text-base font-bold text-slate-950">Similar listings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similarListings.map((s) => (
                    <ListingCard key={s.id} listing={s} slug={slug} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT — sticky agent + contact (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {listing.agent && <AgentCard agent={listing.agent} />}
              {listing.agent?.phone && (
                <CheckoutCTAs agentPhone={listing.agent.phone} agentName={listing.agent.full_name} listingTitle={listing.title} />
              )}
              <ContactForm slug={slug} listingId={listing.id} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact agent block for the overlaid banner widget */
function AgentCardCompact({ agent }: { agent: NonNullable<PublicListingDetail["agent"]> }): React.ReactElement {
  const initials = agent.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-slate-100">
        {agent.photo_url ? (
          <img src={agent.photo_url} alt={agent.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm font-black text-slate-600">
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-950">{agent.full_name}</p>
        <p className="truncate text-xs text-slate-500">{agent.license_id ? `License: ${agent.license_id}` : "Property Advisor"}</p>
      </div>
    </div>
  );
}
