import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicListingItem } from "@/lib/types/public-site";
import { formatAed } from "@/lib/utils/format-currency";
import { listingHandle } from "@/lib/utils/listing-url";

interface ListingCardProps {
  listing: PublicListingItem;
  slug: string;
}

function purposeLabel(purpose: string): string {
  if (purpose === "sale") return "For Sale";
  if (purpose === "rent_short") return "Short-term";
  return "For Rent";
}

/** Derive up to 3 tag strings from listing metadata */
function deriveTags(listing: PublicListingItem): string[] {
  const tags: string[] = [];
  if (listing.listing_tier === "featured") tags.push("Featured");
  if (listing.listing_tier === "premium") tags.push("Premium");
  if (listing.purpose === "rent_short") tags.push("Short-term");
  if (listing.created_at) {
    const age = Date.now() - new Date(listing.created_at).getTime();
    if (age < 14 * 24 * 60 * 60 * 1000) tags.push("New");
  }
  return tags.slice(0, 3);
}

const MAX_VISIBLE_TAGS = 3;

export function ListingCard({ listing, slug }: ListingCardProps): React.ReactElement {
  const tags = deriveTags(listing);
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflow = tags.length - visibleTags.length;

  return (
    <Link
      href={`/p/${slug}/listings/${listingHandle(listing.title, listing.id)}`}
      className="group flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-card-md"
    >
      {/* Hero image */}
      <div className="relative h-60 overflow-hidden rounded-t-[2rem]">
        {listing.primary_photo_url ? (
          <img
            src={listing.primary_photo_url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
            No photo
          </div>
        )}

        {/* Tags overlay — top right of image */}
        {tags.length > 0 && (
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-slate-500 shadow-sm backdrop-blur-sm">
                +{overflow}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3 className="line-clamp-2 text-lg font-black text-slate-950 leading-snug">
          {listing.title}
        </h3>

        {listing.address && (
          <p className="mt-1 truncate text-sm text-slate-500">{listing.address}</p>
        )}

        {/* Price + purpose */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <strong className="text-xl font-black text-slate-950">
            {formatAed(listing.price)}
          </strong>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {purposeLabel(listing.purpose)}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>{listing.beds != null ? `${listing.beds} bed${listing.beds !== 1 ? "s" : ""}` : "—"}</span>
          <span>{listing.baths != null ? `${listing.baths} bath${listing.baths !== 1 ? "s" : ""}` : "—"}</span>
          <span>{listing.area_sqft != null ? `${listing.area_sqft.toLocaleString()} sqft` : "—"}</span>
        </div>

        {/* CTA text link */}
        <div className="mt-4 flex items-center gap-1 text-sm font-bold text-slate-700 transition group-hover:text-slate-950">
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
