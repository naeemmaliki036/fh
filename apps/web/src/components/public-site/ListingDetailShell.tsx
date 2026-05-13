"use client";

import Link from "next/link";
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

export function ListingDetailShell({ listing, slug }: ListingDetailShellProps): React.ReactElement {
  const amenities = Array.isArray(listing.amenities)
    ? listing.amenities.filter((a): a is string => typeof a === "string")
    : [];

  return (
    <div className="bg-[#f7f5ef] py-10">
      <div className="mx-auto w-[min(100%-40px,1280px)]">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate-500">
          <Link href={`/p/${slug}`} className="transition hover:text-slate-950">
            All Properties
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-950">{listing.title}</span>
        </nav>

        {/* Full-width gallery */}
        <ListingGallery urls={listing.media_urls} title={listing.title} />

        {/* 2-column below gallery */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: details */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-4xl font-black leading-snug tracking-tight text-slate-950 md:text-5xl">
                  {listing.title}
                </h1>
                <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black" style={{ color: "var(--accent)" }}>
                  {purposeLabel(listing.purpose)}
                </span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatAed(listing.price)}</p>
              {listing.address && (
                <p className="mt-2 text-sm text-slate-500">{listing.address}</p>
              )}
            </div>

            {/* Stat strip */}
            <div className="flex flex-wrap gap-6 rounded-[2rem] bg-white p-6 shadow-sm">
              {listing.beds != null && (
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-950">{listing.beds}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Bedrooms</p>
                </div>
              )}
              {listing.baths != null && (
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-950">{listing.baths}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Bathrooms</p>
                </div>
              )}
              {listing.area_sqft != null && (
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-950">
                    {listing.area_sqft.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Sq ft</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-black capitalize text-slate-950">
                  {listing.property_type.replace(/_/g, " ")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Type</p>
              </div>
            </div>

            {listing.description && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Description</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
                  {listing.description}
                </p>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="rounded-[2rem] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile: agent + form */}
            <div className="space-y-4 lg:hidden">
              {listing.agent && <AgentCard agent={listing.agent} />}
              <ContactForm slug={slug} listingId={listing.id} compact />
            </div>
          </div>

          {/* Right: sticky agent + form (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {listing.agent && <AgentCard agent={listing.agent} />}
              <ContactForm slug={slug} listingId={listing.id} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
