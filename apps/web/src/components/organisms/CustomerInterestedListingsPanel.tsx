import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { InterestStatusBadge } from "@/components/atoms/InterestStatusBadge";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import type { InterestedListing } from "@/lib/types/customer";
import type { ListingStatus } from "@/lib/types/listing";

interface CustomerInterestedListingsPanelProps {
  listings: InterestedListing[];
}

export function CustomerInterestedListingsPanel({
  listings,
}: CustomerInterestedListingsPanelProps): React.ReactElement {
  if (listings.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 py-10 text-center">
        <p className="text-sm text-muted-foreground">No interested listings yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Listing</th>
            <th className="px-3 py-2 text-left font-medium">Listing status</th>
            <th className="px-3 py-2 text-left font-medium">Interest</th>
            <th className="px-3 py-2 text-left font-medium">Linked</th>
            <th className="px-3 py-2 text-left font-medium">Notes</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {listings.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="px-3 py-2.5 max-w-[200px] truncate" title={item.listing_title}>
                {item.listing_title}
              </td>
              <td className="px-3 py-2.5">
                <ListingStatusBadge status={item.listing_status as ListingStatus} />
              </td>
              <td className="px-3 py-2.5">
                <div className="space-y-0.5">
                  <InterestStatusBadge status={item.interest_status} />
                  {item.interest_status === "lost" && item.won_customer_name && (
                    <p className="text-xs text-destructive">
                      Sold/Rented to {item.won_customer_name}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {new Date(item.linked_at).toLocaleDateString("en-AE")}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">
                {item.notes ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/listings/${item.listing_id}`}
                  className="text-primary hover:underline flex items-center gap-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
