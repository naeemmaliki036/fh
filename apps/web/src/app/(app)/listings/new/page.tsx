"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingWizard } from "@/components/organisms/listing-wizard/ListingWizard";

export default function NewListingPage(): React.ReactElement {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Listing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete the steps to create a new listing.
          </p>
        </div>
      </div>

      <ListingWizard mode="create" />
    </div>
  );
}
