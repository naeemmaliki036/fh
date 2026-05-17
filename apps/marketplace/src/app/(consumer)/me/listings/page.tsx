"use client";

import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { useMyListings } from "@/hooks/queries/useMyListings";
import { MyListingCard } from "@/components/MyListingCard";

export default function MyListingsPage(): React.ReactElement {
  const { data, isLoading, isError } = useMyListings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">My listings</h1>
        <Link
          href="/me/listings/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
        >
          <Plus className="h-4 w-4" /> New listing
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm py-10 text-center">Failed to load listings.</p>
      )}

      {!isLoading && !isError && (data?.items.length === 0) && (
        <div className="text-center py-16 space-y-4">
          <p className="text-slate-500 text-sm">You have not posted any listings yet.</p>
          <Link
            href="/me/listings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" /> Post your first property
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="text-xs text-slate-500">
            {data.active_count} active &middot; {data.total} total
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((l) => (
              <MyListingCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
