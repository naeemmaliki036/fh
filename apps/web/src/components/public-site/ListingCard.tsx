import Link from "next/link";
import type { PublicListingItem } from "@/lib/types/public-site";
import { formatAed } from "@/lib/utils/format-currency";

interface ListingCardProps {
  listing: PublicListingItem;
  slug: string;
}

function purposeLabel(purpose: string): string {
  if (purpose === "sale") return "For Sale";
  if (purpose === "rent_short") return "Short-term Rental";
  return "For Rent";
}

export function ListingCard({ listing, slug }: ListingCardProps): React.ReactElement {
  return (
    <Link
      href={`/p/${slug}/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.primary_photo_url ? (
          <img
            src={listing.primary_photo_url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No photo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          {purposeLabel(listing.purpose)}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <p className="text-lg font-bold text-foreground">
          {formatAed(listing.price)}
        </p>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {listing.title}
        </p>

        {/* Beds / baths / area */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {listing.beds != null && (
            <span>{listing.beds} bed{listing.beds !== 1 ? "s" : ""}</span>
          )}
          {listing.baths != null && (
            <span>{listing.baths} bath{listing.baths !== 1 ? "s" : ""}</span>
          )}
          {listing.area_sqft != null && (
            <span>{listing.area_sqft.toLocaleString()} sqft</span>
          )}
        </div>

        {listing.address && (
          <p className="truncate text-xs text-muted-foreground">{listing.address}</p>
        )}

        <p className="mt-1 text-xs font-medium capitalize text-muted-foreground">
          {listing.property_type.replace(/_/g, " ")}
        </p>
      </div>
    </Link>
  );
}
