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
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href={`/p/${slug}`} className="hover:text-foreground transition-colors">
          All Properties
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{listing.title}</span>
      </nav>

      {/* Desktop: side-by-side; Mobile: stacked */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: gallery + details */}
        <div className="space-y-6">
          <ListingGallery urls={listing.media_urls} title={listing.title} />

          {/* Title + price */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-snug">{listing.title}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {purposeLabel(listing.purpose)}
              </span>
            </div>
            <p className="text-3xl font-bold">{formatAed(listing.price)}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 rounded-xl border bg-card p-4">
            {listing.beds != null && (
              <div className="text-center">
                <p className="text-xl font-semibold">{listing.beds}</p>
                <p className="text-xs text-muted-foreground">Bedrooms</p>
              </div>
            )}
            {listing.baths != null && (
              <div className="text-center">
                <p className="text-xl font-semibold">{listing.baths}</p>
                <p className="text-xs text-muted-foreground">Bathrooms</p>
              </div>
            )}
            {listing.area_sqft != null && (
              <div className="text-center">
                <p className="text-xl font-semibold">
                  {listing.area_sqft.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Sq Ft</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xl font-semibold capitalize">
                {listing.property_type.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-muted-foreground">Type</p>
            </div>
          </div>

          {listing.address && (
            <p className="text-sm text-muted-foreground">{listing.address}</p>
          )}

          {listing.description && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </div>
          )}

          {/* Mobile agent + form */}
          <div className="space-y-4 lg:hidden">
            {listing.agent && <AgentCard agent={listing.agent} />}
            <ContactForm slug={slug} listingId={listing.id} />
          </div>
        </div>

        {/* Right: sticky agent card + form (desktop only) */}
        <div className="hidden space-y-4 lg:block">
          <div className="sticky top-24 space-y-4">
            {listing.agent && <AgentCard agent={listing.agent} />}
            <ContactForm slug={slug} listingId={listing.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
