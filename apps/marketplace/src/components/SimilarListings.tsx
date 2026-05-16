"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMarketplaceListings } from "@/hooks/queries/useMarketplaceListings";
import { MarketplaceListingCard } from "@/components/MarketplaceListingCard";

interface SimilarListingsProps {
  currentId: string;
  propertyType: string;
  country: string | null;
}

export function SimilarListings({
  currentId,
  propertyType,
  country,
}: SimilarListingsProps): React.ReactElement | null {
  const { data } = useMarketplaceListings({
    property_type: propertyType,
    country: country ?? undefined,
    page_size: 7,
    page: 1,
    sort: "verified_first",
  });

  const items = (data?.items ?? []).filter((l) => l.id !== currentId).slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">Similar properties</h2>
        <Link
          href={`/listings?property_type=${propertyType}${country ? `&country=${country}` : ""}`}
          className="flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((l) => (
          <MarketplaceListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
