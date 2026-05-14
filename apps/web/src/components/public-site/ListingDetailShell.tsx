"use client";

import Link from "next/link";
import { BedDouble, Bath, Square, Building2 } from "lucide-react";
import type { PublicListingDetail } from "@/lib/types/public-site";
import { ListingGallery } from "./ListingGallery";
import { AgentCard } from "./AgentCard";
import { ContactForm } from "./ContactForm";
import { formatAed } from "@/lib/utils/format-currency";

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

function StatTile({ icon: Icon, value, label }: StatTileProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="text-lg font-black text-slate-950 leading-none">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function ListingDetailShell({ listing, slug }: ListingDetailShellProps): React.ReactElement {
  const amenities = Array.isArray(listing.amenities)
    ? listing.amenities.filter((a): a is string => typeof a === "string")
    : [];

  return (
    <div className="bg-white min-h-screen">
      {/* Preview banner — shown only when listing is not active */}
      {listing.status !== "active" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-900">
          Preview mode &mdash; this listing is in{" "}
          <strong>{listing.status.replace(/_/g, " ")}</strong> state and is not
          visible on the public site listing index.
        </div>
      )}

      {/* Sticky breadcrumb */}
      <div className="sticky top-[61px] z-10 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto w-[min(100%-40px,1280px)] py-2.5">
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <Link href={`/p/${slug}`} className="hover:text-slate-700 transition-colors font-medium">
              All Properties
            </Link>
            <span>/</span>
            <span className="truncate text-slate-700 font-medium max-w-xs">{listing.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto w-[min(100%-40px,1280px)] py-8">
        {/* 1. Title + tag chips */}
        <div className="mb-6">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
            {listing.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              {purposeLabel(listing.purpose)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 capitalize">
              {listing.property_type.replace(/_/g, " ")}
            </span>
          </div>
          {listing.address && (
            <p className="mt-3 text-sm text-slate-500">{listing.address}</p>
          )}

          {/* 2. Short description — prominent, below title */}
          {listing.short_description && (
            <p className="mt-3 max-w-2xl text-lg text-slate-700 leading-snug">
              {listing.short_description}
            </p>
          )}
        </div>

        {/* 3. Gallery */}
        <ListingGallery urls={listing.media_urls} title={listing.title} />

        {/* 2-column layout */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT: details */}
          <div className="space-y-6">
            {/* 4a. Price — mobile only (desktop in right col) */}
            <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-3xl font-black text-slate-950">{formatAed(listing.price)}</p>
            </div>

            {/* 4b. Stat tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {listing.beds != null && (
                <StatTile icon={BedDouble} value={listing.beds} label="Bedrooms" />
              )}
              {listing.baths != null && (
                <StatTile icon={Bath} value={listing.baths} label="Bathrooms" />
              )}
              {listing.area_sqft != null && (
                <StatTile
                  icon={Square}
                  value={`${listing.area_sqft.toLocaleString()} sqft`}
                  label="Area"
                />
              )}
              <StatTile
                icon={Building2}
                value={listing.property_type.replace(/_/g, " ")}
                label="Type"
              />
            </div>

            {/* 5. Full description */}
            {listing.description && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-base font-black text-slate-950">Description</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h2 className="text-base font-black text-slate-950">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Mobile: agent + contact form */}
            <div className="space-y-4 lg:hidden">
              {listing.agent && <AgentCard agent={listing.agent} />}
              <ContactForm slug={slug} listingId={listing.id} compact />
            </div>
          </div>

          {/* RIGHT: price card + agent + form (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-[110px] space-y-4">
              {/* Price card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <p className="text-3xl font-black text-slate-950">{formatAed(listing.price)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {purposeLabel(listing.purpose)}
                  </span>
                </div>
                {listing.address && (
                  <p className="mt-3 text-xs text-slate-400">{listing.address}</p>
                )}
              </div>
              {listing.agent && <AgentCard agent={listing.agent} />}
              <ContactForm slug={slug} listingId={listing.id} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
