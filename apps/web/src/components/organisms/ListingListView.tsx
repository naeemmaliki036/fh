"use client";

import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { Listing, ListingStatus } from "@/lib/types/listing";

type TransitionDef = { label: string; status: ListingStatus; destructive: boolean };

export function getListingTransitions(l: Listing): TransitionDef[] {
  switch (l.status) {
    case "draft":
      return [
        { label: "Activate", status: "active", destructive: false },
        { label: "Archive", status: "archived", destructive: true },
      ];
    case "active":
      return [
        { label: "Pause", status: "paused", destructive: false },
        { label: "Archive", status: "archived", destructive: true },
      ];
    case "paused":
      return [
        { label: "Activate", status: "active", destructive: false },
        { label: "Archive", status: "archived", destructive: true },
      ];
    case "expired":
      return [
        { label: "Activate", status: "active", destructive: false },
        { label: "Archive", status: "archived", destructive: true },
      ];
    case "archived":
      return [{ label: "Re-list", status: "active", destructive: false }];
  }
}

interface ListingListViewProps {
  listings: Listing[];
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onStatusChange: (listing: Listing, targetStatus: ListingStatus) => void;
}

export function ListingListView({ listings, onEdit, onDelete, onStatusChange }: ListingListViewProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Title</th>
            <th className="px-3 py-2 text-left font-medium">Purpose</th>
            <th className="px-3 py-2 text-left font-medium">Price</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Tier</th>
            <th className="px-3 py-2 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => {
            const transitions = getListingTransitions(l);
            return (
              <tr key={l.id} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2.5 font-medium max-w-[160px] truncate">{l.title}</td>
                <td className="px-3 py-2.5"><ListingPurposeBadge purpose={l.purpose} /></td>
                <td className="px-3 py-2.5 text-muted-foreground">{l.currency} {l.price}</td>
                <td className="px-3 py-2.5"><ListingStatusBadge status={l.status} /></td>
                <td className="px-3 py-2.5 capitalize text-muted-foreground">{l.listing_tier}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
