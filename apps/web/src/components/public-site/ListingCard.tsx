import Link from "next/link";
import type { PublicListingItem } from "@/lib/types/public-site";
import { formatAed } from "@/lib/utils/format-currency";

interface ListingCardProps {
  listing: PublicListingItem;
  slug: string;
}

function purposeLabel(purpose: string): string {
  if (purpose === "sale") return "For Sale";
  if (purpose === "rent_short") return "Short-term";
  return "For Rent";
}

function deriveTag(listing: PublicListingItem): string | null {
  if (listing.listing_tier === "featured") return "Featured";
  if (listing.purpose === "rent_short") return "Short-term";
  if (listing.created_at) {
    const age = Date.now() - new Date(listing.created_at).getTime();
    if (age < 14 * 24 * 60 * 60 * 1000) return "New";
  }
  return null;
}

export function ListingCard({ listing, slug }: ListingCardProps): React.ReactElement {
  const tag = deriveTag(listing);

  return (
    <Link
      href={`/p/${slug}/listings/${listing.id}`}
      className="group overflow-hidden rounded-[2rem] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
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
        {tag && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-800 backdrop-blur">
            {tag}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <strong className="text-2xl font-black">{formatAed(listing.price)}</strong>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
            {purposeLabel(listing.purpose)}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-black text-slate-950 line-clamp-1">{listing.title}</h3>

        {listing.address && (
          <p className="mt-2 truncate text-sm font-medium text-slate-500">{listing.address}</p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <span>{listing.beds != null ? `${listing.beds} beds` : "—"}</span>
          <span>{listing.baths != null ? `${listing.baths} baths` : "—"}</span>
          <span>{listing.area_sqft != null ? `${listing.area_sqft.toLocaleString()} sqft` : "—"}</span>
        </div>

        <span className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-slate-50">
          View details
        </span>
      </div>
    </Link>
  );
}
