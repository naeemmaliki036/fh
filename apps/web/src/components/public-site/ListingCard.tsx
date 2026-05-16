import Link from "next/link";
import { ArrowRight, BedDouble, Bath, Square } from "lucide-react";
import type { PublicListingItem } from "@/lib/types/public-site";
import { formatAed } from "@/lib/utils/format-currency";
import { listingHandle } from "@/lib/utils/listing-url";
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge";
import { ReferenceBadge } from "@/components/atoms/ReferenceBadge";
import { PriceDropBadge } from "@/components/atoms/PriceDropBadge";
import { PostedAgo } from "@/components/atoms/PostedAgo";

interface ListingCardProps {
  listing: PublicListingItem;
  slug: string;
}

function purposeLabel(purpose: string): string {
  if (purpose === "sale") return "For Sale";
  if (purpose === "rent_short") return "Short-term";
  return "For Rent";
}

function deriveTags(listing: PublicListingItem): string[] {
  const tags: string[] = [];
  if (listing.listing_tier === "featured") tags.push("Featured");
  if (listing.listing_tier === "premium") tags.push("Premium");
  if (listing.created_at) {
    const age = Date.now() - new Date(listing.created_at).getTime();
    if (age < 14 * 24 * 60 * 60 * 1000) tags.push("New");
  }
  return tags.slice(0, 2);
}

export function ListingCard({ listing, slug }: ListingCardProps): React.ReactElement {
  const tags = deriveTags(listing);
  const href = `/p/${slug}/listings/${listingHandle(listing.title, listing.id)}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-card"
    >
      {/* Inset media frame — launchpad style */}
      <div className="relative m-3 h-64 overflow-hidden rounded-2xl">
        {listing.primary_photo_url ? (
          <img
            src={listing.primary_photo_url}
            alt={listing.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
        )}

        {/* PriceDrop overlay — top right of image */}
        {listing.price_drop_pct && listing.price_drop_pct > 0 && (
          <div className="absolute right-3 top-3 z-10">
            <PriceDropBadge pct={listing.price_drop_pct} />
          </div>
        )}

        {/* Reference badge — bottom-right of media frame */}
        {listing.internal_reference && (
          <div className="absolute bottom-[74px] right-3 z-10">
            <ReferenceBadge reference={listing.internal_reference} />
          </div>
        )}

        {/* Status pills — top left */}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
            {purposeLabel(listing.purpose)}
          </span>
          {listing.is_verified && <VerifiedBadge />}
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: "var(--accent, hsl(var(--primary)))" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Gradient title overlay — bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-5">
          <h3 className="line-clamp-1 text-[18px] font-semibold text-white">
            {listing.title}
          </h3>
          {(listing.area || listing.city || listing.address) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-white/75">
              {[listing.area, listing.city].filter(Boolean).join(", ") || listing.address}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-1">
        {/* Short description */}
        {listing.short_description && (
          <p className="line-clamp-2 min-h-[2lh] text-[13px] leading-relaxed text-slate-500">
            {listing.short_description}
          </p>
        )}

        {/* Stat strip — horizontal, separated */}
        <div className="flex items-center gap-4 text-[13px] text-slate-600">
          {listing.beds != null && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">{listing.beds}</span>
              <span className="text-slate-400">bd</span>
            </span>
          )}
          {listing.baths != null && (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">{listing.baths}</span>
              <span className="text-slate-400">ba</span>
            </span>
          )}
          {listing.area_sqft != null && (
            <span className="inline-flex items-center gap-1.5">
              <Square className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">{listing.area_sqft.toLocaleString()}</span>
              <span className="text-slate-400">sqft</span>
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Price</p>
            <p className="text-[15px] font-bold text-slate-950">{formatAed(listing.price)}</p>
            {listing.price_per_sqft != null && (
              <p className="text-[11px] text-slate-400">AED {listing.price_per_sqft.toLocaleString()} / sqft</p>
            )}
            <PostedAgo days={listing.days_since_posted} />
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          >
            View Details <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
