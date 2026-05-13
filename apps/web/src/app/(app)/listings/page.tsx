"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useListings } from "@/hooks/queries/useListings";
import { ListingFiltersBar } from "@/components/organisms/ListingFiltersBar";
import { ListingsTable } from "@/components/organisms/ListingsTable";
import type { ListingListParams } from "@/lib/types/listing";

function ListingsContent(): React.ReactElement {
  const searchParams = useSearchParams();

  const params: ListingListParams = {
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as ListingListParams["status"]) ?? undefined,
    purpose: (searchParams.get("purpose") as ListingListParams["purpose"]) ?? undefined,
    listing_tier: (searchParams.get("listing_tier") as ListingListParams["listing_tier"]) ?? undefined,
    assigned_agent_id: searchParams.get("assigned_agent_id") ?? undefined,
    min_price: searchParams.get("min_price") ?? undefined,
    max_price: searchParams.get("max_price") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    city: searchParams.get("city") ?? undefined,
  };

  const { data, isLoading, error } = useListings(params);
  const listings = data?.items ?? [];

  return (
    <div className="space-y-4">
      <ListingFiltersBar />
      {error && <p className="text-sm text-destructive">Failed to load listings.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && (
        <>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} listings</p>
          <ListingsTable listings={listings} />
        </>
      )}
    </div>
  );
}

export default function ListingsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and filter all listings</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <ListingsContent />
      </Suspense>
    </div>
  );
}
