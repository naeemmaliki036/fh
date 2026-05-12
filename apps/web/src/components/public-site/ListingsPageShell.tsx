"use client";

import { useState } from "react";
import type { PublicTenantProfile, PublicListingsParams } from "@/lib/types/public-site";
import { ListingFilters } from "./ListingFilters";
import { ListingsGrid } from "./ListingsGrid";
import { usePublicSiteListings } from "@/hooks/queries/public-site/usePublicSite";

interface ListingsPageShellProps {
  profile: PublicTenantProfile;
  slug: string;
}

export function ListingsPageShell({ profile, slug }: ListingsPageShellProps): React.ReactElement {
  const [filterParams, setFilterParams] = useState<PublicListingsParams>({ page: 1, page_size: 12 });

  const { data, isLoading } = usePublicSiteListings(slug, filterParams);

  const totalPages = data ? Math.ceil(data.total / (data.page_size || 12)) : 0;
  const currentPage = data?.page ?? 1;

  const handleFilter = (params: PublicListingsParams): void => {
    setFilterParams((prev) => ({ ...prev, ...params }));
  };

  const goToPage = (page: number): void => {
    setFilterParams((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      {/* Hero */}
      <div className="space-y-2 text-center">
        {profile.logo_url && (
          <img
            src={profile.logo_url}
            alt={profile.name}
            className="mx-auto mb-4 h-16 w-auto object-contain"
          />
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{profile.name}</h1>
        {profile.tagline && (
          <p className="text-lg text-muted-foreground">{profile.tagline}</p>
        )}
      </div>

      {/* Filters */}
      <ListingFilters initialParams={filterParams} onFilter={handleFilter} />

      {/* Results count */}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? "property" : "properties"} found
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <ListingsGrid listings={data?.items ?? []} slug={slug} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-9 rounded-md border px-3 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-9 rounded-md border px-3 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
