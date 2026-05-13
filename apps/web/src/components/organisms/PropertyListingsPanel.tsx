"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List, Plus, ExternalLink } from "lucide-react";
import { usePropertyListings } from "@/hooks/queries/useProperties";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { usePublicSiteSettings } from "@/hooks/queries/tenant-public-site/usePublicSiteSettings";
import { useDeleteListing, useChangeListingStatus } from "@/hooks/mutations/useListingMutations";
import { ListingListView } from "@/components/organisms/ListingListView";
import { ListingCardView } from "@/components/organisms/ListingCardView";
import { ListingCreateDialog } from "@/components/organisms/ListingCreateDialog";
import { ListingFormDialog } from "@/components/organisms/ListingFormDialog";
import { StatusChangeDialog } from "@/components/molecules/StatusChangeDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  LISTING_PAUSED_REASONS,
  LISTING_ACTIVE_REASONS,
  LISTING_ARCHIVED_REASONS,
  LISTING_UNARCHIVE_REASONS,
} from "@/lib/constants/status-reasons";
import type { Listing, ListingStatus } from "@/lib/types/listing";
import type { PropertiesViewMode } from "@/lib/types/tenant";

const STORAGE_KEY = "listings_view_mode";

const LISTING_TRANSITION_TITLES: Record<string, string> = {
  draft: "Save as Draft",
  active: "Activate",
  paused: "Pause",
  sold: "Mark as Sold",
  rented: "Mark as Rented",
  expired: "Mark Expired",
  archived: "Archive",
  off_market: "Mark Off Market",
};

type PendingTransition = { listing: Listing; targetStatus: ListingStatus };

function reasonOptions(targetStatus: ListingStatus, fromStatus: ListingStatus) {
  if (targetStatus === "paused") return LISTING_PAUSED_REASONS;
  if (targetStatus === "archived") return LISTING_ARCHIVED_REASONS;
  if (targetStatus === "active" && fromStatus === "archived") return LISTING_UNARCHIVE_REASONS;
  return LISTING_ACTIVE_REASONS;
}

interface PropertyListingsPanelProps {
  propertyId: string;
}

export function PropertyListingsPanel({ propertyId }: PropertyListingsPanelProps): React.ReactElement {
  const { data, isLoading, error } = usePropertyListings(propertyId);
  const { data: tenant } = useMyTenant();
  const { data: publicSite } = usePublicSiteSettings();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const [viewMode, setViewMode] = useState<PropertiesViewMode | null>(null);

  const { mutate: remove } = useDeleteListing(propertyId);
  const { mutateAsync: changeStatus } = useChangeListingStatus(propertyId);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PropertiesViewMode | null;
    if (stored === "card" || stored === "list") {
      setViewMode(stored);
    } else {
      setViewMode(tenant?.default_properties_view ?? "card");
    }
  }, [tenant?.default_properties_view]);

  const activeView = viewMode ?? "card";
  const listings = data?.items ?? [];

  const handleViewChange = (mode: PropertiesViewMode): void => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  if (error) return <p className="text-sm text-destructive">Failed to load listings.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-md border">
          <button
            type="button"
            aria-label="Card view"
            onClick={() => handleViewChange("card")}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-l-md transition-colors",
              activeView === "card" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => handleViewChange("list")}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-r-md transition-colors",
              activeView === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {publicSite?.public_site_enabled && publicSite.slug && (
            <Button asChild variant="outline" size="sm">
              <a href={`/p/${publicSite.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />View public site
              </a>
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)}><Plus className="mr-1.5 h-4 w-4" />New Listing</Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading listings...</p>}

      {!isLoading && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 border rounded-md bg-muted/20 text-muted-foreground">
          <p className="text-sm font-medium">No listings yet</p>
          <p className="text-xs">Create a listing to publish this property to the market.</p>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1.5 h-4 w-4" />New Listing</Button>
        </div>
      )}

      {!isLoading && listings.length > 0 && activeView === "card" && (
        <ListingCardView
          listings={listings}
          onEdit={setEditTarget}
          onDelete={remove}
          onStatusChange={(l, s) => setPending({ listing: l, targetStatus: s })}
        />
      )}

      {!isLoading && listings.length > 0 && activeView === "list" && (
        <ListingListView
          listings={listings}
          onEdit={setEditTarget}
          onDelete={remove}
          onStatusChange={(l, s) => setPending({ listing: l, targetStatus: s })}
        />
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

      {pending && (
        <StatusChangeDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null); }}
          title={`${LISTING_TRANSITION_TITLES[pending.targetStatus] ?? "Change Status"} listing?`}
          description={
            pending.targetStatus === "archived"
              ? "This listing will be archived and no longer visible."
              : pending.targetStatus === "paused"
              ? "This listing will be paused and not shown publicly."
              : "This listing will be set to active and visible."
          }
          reasonOptions={reasonOptions(pending.targetStatus, pending.listing.status)}
          destructive={pending.targetStatus === "archived"}
          onConfirm={async (reason_code, reason_note) => {
            await changeStatus({
              id: pending.listing.id,
              status: pending.targetStatus,
              reason_code,
              reason_note,
            });
          }}
        />
      )}
    </div>
  );
}
