"use client";

import { Loader2 } from "lucide-react";
import { useMyFavorites } from "@/hooks/queries/useMyFavorites";
import { MarketplaceListingCard } from "@/components/MarketplaceListingCard";
import Link from "next/link";

export default function MyFavoritesPage(): React.ReactElement {
  const { data, isLoading, isError } = useMyFavorites();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Saved favorites</h1>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm py-10 text-center">Failed to load favorites.</p>
      )}

      {!isLoading && !isError && (data?.items.length === 0) && (
        <div className="text-center py-16 space-y-4">
          <p className="text-slate-500 text-sm">No saved listings yet.</p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-600 transition"
          >
            Browse listings
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="text-xs text-slate-500">{data.total} saved</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((l) => (
              <MarketplaceListingCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
