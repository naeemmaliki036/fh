"use client";

import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { useMyListings } from "@/hooks/queries/useMyListings";
import { MyListingCard } from "@/components/MyListingCard";
import type { ConsumerListingItem } from "@fh/portal-types";

// Listings needing action sorted first
const PRIORITY_ORDER: Record<string, number> = {
  draft: 0,
  changes_requested: 1,
  pending_review: 2,
  active: 3,
  paused: 4,
  expired: 5,
  sold: 6,
  rented: 7,
  archived: 8,
};

function sortListings(items: ConsumerListingItem[]): ConsumerListingItem[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.status] ?? 99;
    const pb = PRIORITY_ORDER[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export default function MyListingsPage(): React.ReactElement {
  const { data, isLoading, isError } = useMyListings();

  const sortedItems = data ? sortListings(data.items) : [];
  const hasDraft = sortedItems.some((l) => l.status === "draft");
  const firstDraft = sortedItems.find((l) => l.status === "draft");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">My listings</h1>
        {hasDraft && firstDraft ? (
          <Link
            href={`/me/listings/${firstDraft.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
          >
            Continue draft
          </Link>
        ) : (
          <Link
            href="/me/listings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" /> New listing
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm py-10 text-center">Failed to load listings.</p>
      )}

      {!isLoading && !isError && sortedItems.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <p className="text-slate-500 text-sm">You have not posted any listings yet.</p>
          <Link
            href="/me/listings/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" /> List your first property
          </Link>
        </div>
      )}

      {sortedItems.length > 0 && (
        <>
          <p className="text-xs text-slate-500">
            {data?.active_count} active &middot; {data?.total} total
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedItems.map((l) => (
              <MyListingCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
