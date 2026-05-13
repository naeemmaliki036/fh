"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListing } from "@/hooks/queries/useListings";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { ListingMediaPanel } from "@/components/organisms/ListingMediaPanel";
import { ListingDocumentsPanel } from "@/components/organisms/ListingDocumentsPanel";
import { ReviewDecisionDialog } from "@/components/organisms/listing-wizard/ReviewDecisionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex gap-2 py-2 border-b last:border-0">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">{value ?? <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}

export default function ListingReviewPage({ params }: ReviewPageProps): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const { data: listing, isLoading, error } = useListing(id);
  const [decisionDialog, setDecisionDialog] = useState<"approved" | "changes_requested" | null>(null);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading listing...</p>;
  }

  if (error || !listing) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Listing not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/listings"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/listings/pending-reviews"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <ListingPurposeBadge purpose={listing.purpose} />
            <ListingStatusBadge status={listing.status} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-4">
          <div className="rounded-md border bg-muted/20 px-4 py-1">
            <DetailRow label="Property ID" value={listing.property_id} />
            <DetailRow label="Purpose" value={listing.purpose.replace("_", " ")} />
            {listing.rent_period && <DetailRow label="Rent Period" value={listing.rent_period} />}
            <DetailRow label="Valid From" value={listing.valid_from} />
            <DetailRow label="Valid Until" value={listing.valid_until} />
            <DetailRow label="Price" value={`${listing.currency} ${parseFloat(listing.price).toLocaleString()}`} />
            <DetailRow label="Tier" value={listing.listing_tier} />
            <DetailRow label="Description" value={
              listing.description
                ? <span className="whitespace-pre-wrap">{listing.description}</span>
                : null
            } />
            <DetailRow label="Tags" value={
              listing.tags && listing.tags.length > 0
                ? <div className="flex flex-wrap gap-1">
                    {listing.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                : null
            } />
          </div>
        </TabsContent>

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
      </Tabs>

      <div className="sticky bottom-0 bg-background border-t py-3 flex gap-3">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setDecisionDialog("approved")}
        >
          Approve
        </Button>
        <Button
          variant="outline"
          className="border-amber-400 text-amber-700 hover:bg-amber-50"
          onClick={() => setDecisionDialog("changes_requested")}
        >
          Request Changes
        </Button>
      </div>

      {decisionDialog && (
        <ReviewDecisionDialog
          listingId={listing.id}
          decision={decisionDialog}
          open={!!decisionDialog}
          onOpenChange={(open) => { if (!open) setDecisionDialog(null); }}
          onSuccess={() => router.push(`/listings/${listing.id}`)}
        />
      )}
    </div>
  );
}
