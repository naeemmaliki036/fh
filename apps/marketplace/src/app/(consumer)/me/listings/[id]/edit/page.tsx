"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { useMyListings } from "@/hooks/queries/useMyListings";
import { ListingWizard } from "@/components/wizard/ListingWizard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data, isLoading } = useMyListings();
  const listing = data?.items.find((l) => l.id === id) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-20 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!listing) {
    return <p className="text-red-500 py-10 text-center">Listing not found.</p>;
  }

  const isPendingReview = listing.status === "pending_review";
  const isReApproval = listing.status === "active";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">
        {isPendingReview ? "Awaiting review" : "Edit listing"}
      </h1>
      {isPendingReview ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-amber-800">
            This listing is currently under review. Editing is disabled until moderation is complete.
          </p>
          <p className="text-xs text-amber-600 mt-1">Usually within 24 hours.</p>
        </div>
      ) : (
        <ListingWizard
          initialListing={listing}
          initialStep={listing.status === "draft" ? "purpose-type" : "review"}
          isReApproval={isReApproval}
        />
      )}
    </div>
  );
}
