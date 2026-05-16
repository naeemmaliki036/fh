"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMarketplaceListings } from "@/hooks/queries/marketplace/useMarketplaceListings";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";
import { MarketplaceFiltersBar } from "@/components/marketplace/MarketplaceFiltersBar";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { ListYourPropertyWizard } from "@/components/marketing/ListYourPropertyWizard";
import type { MarketplaceListingsParams } from "@/lib/types/marketplace";

function paramsFromSearch(search: ReturnType<typeof useSearchParams>): MarketplaceListingsParams {
  const p: MarketplaceListingsParams = {};
  const purpose = search.get("purpose");
  if (purpose) p.purpose = purpose;
  const propertyType = search.get("property_type");
  if (propertyType) p.property_type = propertyType;
  const q = search.get("q");
  if (q) p.q = q;
  const isVerified = search.get("is_verified");
  if (isVerified === "true") p.is_verified = true;
  return p;
}

export default function MarketplaceListingsPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<MarketplaceListingsParams>({
    sort: "verified_first",
    page: 1,
    page_size: 20,
    ...paramsFromSearch(searchParams),
  });
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data, isLoading, isError } = useMarketplaceListings(filters);
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;

  const totalPages = data ? Math.ceil(data.total / (filters.page_size ?? 20)) : 1;
  const currentPage = filters.page ?? 1;

  return (
    <div className="mx-auto w-[min(100%-24px,1440px)] py-6 space-y-5">
      <MarketplaceFiltersBar params={filters} onChange={setFilters} />

      {/* 80/20 grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
        {/* Left: listings */}
        <section>
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading listings...
            </div>
          )}
          {isError && (
            <p className="py-10 text-center text-sm text-red-500">
              Failed to load listings. Please try again.
            </p>
          )}
          {!isLoading && !isError && listings.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <p className="text-base font-semibold">No listings found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}

          {!isLoading && !isError && listings.length > 0 && (
            <>
              <p className="text-sm text-slate-500 mb-3">
                <span className="font-bold text-slate-800">{total.toLocaleString()}</span> listings found
              </p>
              <div className="flex flex-col gap-3">
                {listings.map((l) => (
                  <MarketplaceListingCard key={l.id} listing={l} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Right: sidebar */}
        <MarketplaceSidebar onListWithUs={() => setWizardOpen(true)} />
      </div>

      <ListYourPropertyWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
