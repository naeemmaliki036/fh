import type { PublicListingItem } from "@/lib/types/public-site";
import { ListingCard } from "./ListingCard";

interface ListingsGridProps {
  listings: PublicListingItem[];
  slug: string;
}

export function ListingsGrid({ listings, slug }: ListingsGridProps): React.ReactElement {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-foreground">No listings found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} slug={slug} />
      ))}
    </div>
  );
}
