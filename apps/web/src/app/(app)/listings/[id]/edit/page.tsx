"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListing } from "@/hooks/queries/useListings";
import { ListingWizard } from "@/components/organisms/listing-wizard/ListingWizard";
import type { WizardStep } from "@/components/organisms/listing-wizard/wizard-schema";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: EditListingPageProps): React.ReactElement {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { data: listing, isLoading, error } = useListing(id);

  const stepParam = searchParams.get("step");
  const initialStep = (stepParam ? Math.min(Math.max(parseInt(stepParam, 10), 1), 7) : 1) as WizardStep;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading listing...</p>;
  }

  if (error || !listing) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Listing not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to listings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/listings/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            Edit: {listing.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update listing details across all steps.
          </p>
        </div>
      </div>

      <ListingWizard mode="edit" initial={listing} initialStep={initialStep} />
    </div>
  );
}
