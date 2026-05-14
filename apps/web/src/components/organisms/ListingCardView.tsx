"use client";

import { ExternalLink } from "lucide-react";
import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { getListingTransitions } from "@/components/organisms/ListingListView";
import { formatListingPrice } from "@/lib/utils/format-listing-price";
import { listingHandle } from "@/lib/utils/listing-url";
import type { Listing, ListingStatus } from "@/lib/types/listing";

interface ListingCardViewProps {
  listings: Listing[];
  tenantSlug: string | null;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onStatusChange: (listing: Listing, targetStatus: ListingStatus) => void;
}

export function ListingCardView({
  listings,
  tenantSlug,
  onEdit,
  onDelete,
  onStatusChange,
}: ListingCardViewProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {listings.map((l) => {
        const transitions = getListingTransitions(l);
        const publicHref = tenantSlug
          ? `/p/${tenantSlug}/listings/${listingHandle(l.title, l.id)}`
          : null;
        return (
          <div key={l.id} className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm line-clamp-2 flex-1">{l.title}</p>
              <ListingStatusBadge status={l.status} />
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <ListingPurposeBadge purpose={l.purpose} />
              <span className="text-xs text-muted-foreground capitalize">{l.listing_tier}</span>
            </div>
            <p className="text-sm font-medium">{formatListingPrice(l.price, l.currency ?? undefined)}</p>
            <div className="flex flex-wrap gap-1">
              {publicHref && (
                <Button size="sm" variant="outline" asChild>
                  <a href={publicHref} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />View on site
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onEdit(l)}>Edit</Button>
              {transitions.map((t) => (
                <Button
                  key={t.status}
                  size="sm"
                  variant={t.destructive ? "destructive" : "secondary"}
                  onClick={() => onStatusChange(l, t.status)}
                >
                  {t.label}
                </Button>
              ))}
              <ConfirmDialog
                trigger={<Button size="sm" variant="ghost">Delete</Button>}
                title="Delete listing?"
                description="This listing will be permanently removed and cannot be undone."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => onDelete(l.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
