"use client";

import { useState } from "react";
import { usePropertyListings } from "@/hooks/queries/useProperties";
import {
  useDeleteListing,
  useActivateListing,
  usePauseListing,
  useArchiveListing,
} from "@/hooks/mutations/useListingMutations";
import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ListingCreateDialog } from "@/components/organisms/ListingCreateDialog";
import { ListingFormDialog } from "@/components/organisms/ListingFormDialog";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/types/listing";

interface PropertyListingsPanelProps {
  propertyId: string;
}

export function PropertyListingsPanel({ propertyId }: PropertyListingsPanelProps): React.ReactElement {
  const { data, isLoading, error } = usePropertyListings(propertyId);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);

  const { mutate: activate } = useActivateListing(propertyId);
  const { mutate: pause } = usePauseListing(propertyId);
  const { mutate: archive } = useArchiveListing(propertyId);
  const { mutate: remove } = useDeleteListing(propertyId);

  const listings = data?.items ?? [];

  if (error) return <p className="text-sm text-destructive">Failed to load listings.</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>+ New Listing</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading listings...</p>}

      {!isLoading && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-muted/20 text-muted-foreground">
          <p className="text-sm font-medium">No listings yet</p>
        </div>
      )}

      {listings.length > 0 && (
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
              {listings.map(l => (
                <tr key={l.id} className="border-b">
                  <td className="px-3 py-2.5 font-medium max-w-[160px] truncate">{l.title}</td>
                  <td className="px-3 py-2.5"><ListingPurposeBadge purpose={l.purpose} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{l.currency} {l.price}</td>
                  <td className="px-3 py-2.5"><ListingStatusBadge status={l.status} /></td>
                  <td className="px-3 py-2.5 capitalize text-muted-foreground">{l.listing_tier}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(l)}>Edit</Button>
                      {l.status === "draft" || l.status === "paused"
                        ? <Button size="sm" variant="default" onClick={() => activate(l.id)}>Activate</Button>
                        : null}
                      {l.status === "active"
                        ? <Button size="sm" variant="secondary" onClick={() => pause(l.id)}>Pause</Button>
                        : null}
                      {l.status !== "archived"
                        ? <Button size="sm" variant="ghost" onClick={() => archive(l.id)}>Archive</Button>
                        : null}
                      <Button size="sm" variant="destructive" onClick={() => remove(l.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ListingCreateDialog propertyId={propertyId} open={showCreate} onClose={() => setShowCreate(false)} />
      {editTarget && (
        <ListingFormDialog
          propertyId={propertyId}
          listing={editTarget}
          open
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
