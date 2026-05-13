"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Pencil, Rocket, ClipboardCheck } from "lucide-react";
import { useListing } from "@/hooks/queries/useListings";
import { useListingPriceHistory } from "@/hooks/queries/useListingPrice";
import { useChangeListingStatus } from "@/hooks/mutations/useListingMutations";
import { usePublishListing } from "@/hooks/mutations/useListingReviewMutations";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { PriceChangeBadge } from "@/components/atoms/PriceChangeBadge";
import { StatusHeaderBar } from "@/components/molecules/StatusHeaderBar";
import { ChangePriceModal } from "@/components/molecules/ChangePriceModal";
import { ListingMediaPanel } from "@/components/organisms/ListingMediaPanel";
import { ListingDocumentsPanel } from "@/components/organisms/ListingDocumentsPanel";
import { ListingPriceHistoryPanel } from "@/components/organisms/ListingPriceHistoryPanel";
import { AuditTimelinePanel } from "@/components/organisms/AuditTimelinePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LISTING_PAUSED_REASONS,
  LISTING_ACTIVE_REASONS,
  LISTING_ARCHIVED_REASONS,
  LISTING_SOLD_REASONS,
  LISTING_RENTED_REASONS,
  LISTING_OFF_MARKET_REASONS,
} from "@/lib/constants/status-reasons";
import type { ListingStatus } from "@/lib/types/listing";

const REVIEWER_ROLES = new Set(["listing_manager", "company_admin", "company_owner"]);

const LISTING_TRANSITIONS: Array<{
  fromStatuses: ListingStatus[];
  status: ListingStatus;
  label: string;
  destructive?: boolean;
}> = [
  { fromStatuses: ["draft", "paused"], status: "active", label: "Make Live" },
  { fromStatuses: ["active"], status: "paused", label: "Pause" },
  { fromStatuses: ["active", "paused", "draft"], status: "sold", label: "Mark Sold" },
  { fromStatuses: ["active", "paused", "draft"], status: "rented", label: "Mark Rented" },
  { fromStatuses: ["active", "paused", "expired"], status: "off_market", label: "Mark Off-Market", destructive: true },
  { fromStatuses: ["active", "paused", "draft", "expired"], status: "archived", label: "Archive", destructive: true },
];

function getReasonOptions(status: ListingStatus) {
  if (status === "paused") return LISTING_PAUSED_REASONS;
  if (status === "archived") return LISTING_ARCHIVED_REASONS;
  if (status === "sold") return LISTING_SOLD_REASONS;
  if (status === "rented") return LISTING_RENTED_REASONS;
  if (status === "off_market") return LISTING_OFF_MARKET_REASONS;
  return LISTING_ACTIVE_REASONS;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { currentUser } = useAuth();
  const { data: listing, isLoading, error } = useListing(id);
  const { data: priceHistory } = useListingPriceHistory(id);
  const { mutateAsync: changeStatus } = useChangeListingStatus(listing?.property_id ?? "");
  const { mutateAsync: publish, isPending: publishing } = usePublishListing(id);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const isReviewer = !!currentUser && REVIEWER_ROLES.has(currentUser.role);
  const isAssignedReviewer = isReviewer && listing?.assigned_reviewer_id === currentUser?.id;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading listing...</p>;
  }

  if (error || !listing) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Listing not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/listings"><ArrowLeft className="mr-2 h-4 w-4" />Back to listings</Link>
        </Button>
      </div>
    );
  }

  const transitions = LISTING_TRANSITIONS
    .filter((t) => t.fromStatuses.includes(listing.status))
    .map((t) => ({
      status: t.status,
      label: t.label,
      destructive: t.destructive,
      reasonOptions: getReasonOptions(t.status),
    }));

  const historyItems = priceHistory?.items ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/listings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{listing.title}</h1>
          <div className="flex items-center flex-wrap gap-2 mt-0.5">
            <ListingPurposeBadge purpose={listing.purpose} />
            <StatusHeaderBar
              statusBadge={<ListingStatusBadge status={listing.status} />}
              transitions={transitions}
              onChangeStatus={async (status, reasonCode, reasonNote) => {
                await changeStatus({ id: listing.id, status, reason_code: reasonCode, reason_note: reasonNote });
              }}
            />
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-sm font-medium">
                {listing.currency} {parseFloat(listing.price).toLocaleString()}
              </span>
              <PriceChangeBadge history={historyItems} />
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 text-xs"
                onClick={() => setShowPriceModal(true)}
              >
                <DollarSign className="h-3 w-3" />Change price
              </Button>
            </div>
          </div>

          {/* Status-contextual action buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {listing.status === "approved" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                disabled={publishing}
                onClick={() => publish()}
              >
                <Rocket className="h-3.5 w-3.5" />
                {publishing ? "Publishing…" : "Publish to Market"}
              </Button>
            )}
            {listing.status === "pending_review" && isAssignedReviewer && (
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/listings/${listing.id}/review`}>
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Review Now
                </Link>
              </Button>
            )}
            {listing.status === "changes_requested" && (
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/listings/${listing.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Open in Editor to Revise
                </Link>
              </Button>
            )}
            {(listing.status === "draft" || listing.status === "changes_requested") && (
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/listings/${listing.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="media">
        <TabsList>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="price-history">Price History</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="pt-4">
          <ListingMediaPanel
            listingId={listing.id}
            propertyId={listing.property_id}
            heroMediaId={listing.hero_media_id}
          />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <ListingDocumentsPanel listingId={listing.id} />
        </TabsContent>

        <TabsContent value="price-history" className="pt-4">
          <ListingPriceHistoryPanel listingId={listing.id} />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <AuditTimelinePanel entityType="listing" entityId={listing.id} />
        </TabsContent>
      </Tabs>

      <ChangePriceModal
        listingId={listing.id}
        currentPrice={listing.price}
        currency={listing.currency}
        open={showPriceModal}
        onOpenChange={setShowPriceModal}
      />
    </div>
  );
}
