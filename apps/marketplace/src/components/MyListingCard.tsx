"use client";

import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ConsumerListingItem, ConsumerListingStatus } from "@fh/portal-types";
import { useMarkListingStatus, useDeleteListing } from "@/hooks/mutations/useMyListingMutations";

interface MyListingCardProps {
  listing: ConsumerListingItem;
}

const STATUS_COLORS: Record<ConsumerListingStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  sold: "bg-slate-100 text-slate-600",
  rented: "bg-blue-100 text-blue-700",
  archived: "bg-red-50 text-red-500",
};

function daysToExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function MyListingCard({ listing }: MyListingCardProps): React.ReactElement {
  const markStatus = useMarkListingStatus();
  const deleteMut = useDeleteListing();
  const days = daysToExpiry(listing.expires_at);

  const isActive = listing.status === "active";
  const isPaused = listing.status === "paused";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="relative aspect-[3/2] bg-slate-100">
        {listing.primary_photo_url ? (
          <img
            src={listing.primary_photo_url}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300 text-xs">
            No image
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", STATUS_COLORS[listing.status])}>
            {listing.status}
          </span>
          {days !== null && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold",
              days <= 7 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600",
            )}>
              {days}d left
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-black text-slate-900 line-clamp-2">{listing.title}</p>
          <p className="text-base font-black text-teal-700 mt-0.5">
            {listing.currency} {listing.price.toLocaleString("en-AE")}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
            <MapPin className="h-3 w-3 text-teal-500" />
            <span>{[listing.area, listing.city].filter(Boolean).join(", ") || "Location TBC"}</span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {new Date(listing.created_at).toLocaleDateString("en-AE", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <Link
            href={`/me/listings/${listing.id}/edit`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-600 transition"
          >
            Edit
          </Link>
          {isActive && (
            <>
              <button
                onClick={() => markStatus.mutate({ id: listing.id, body: { status: "sold" } })}
                disabled={markStatus.isPending}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-60"
              >
                Mark sold
              </button>
              <button
                onClick={() => markStatus.mutate({ id: listing.id, body: { status: "rented" } })}
                disabled={markStatus.isPending}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-60"
              >
                Mark rented
              </button>
              <button
                onClick={() => markStatus.mutate({ id: listing.id, body: { status: "paused" } })}
                disabled={markStatus.isPending}
                className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition disabled:opacity-60"
              >
                Pause
              </button>
            </>
          )}
          {isPaused && (
            <button
              onClick={() => markStatus.mutate({ id: listing.id, body: { status: "active" } })}
              disabled={markStatus.isPending}
              className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-60"
            >
              Activate
            </button>
          )}
          <button
            onClick={() => { if (confirm("Archive this listing?")) deleteMut.mutate(listing.id); }}
            disabled={deleteMut.isPending}
            className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition disabled:opacity-60 ml-auto"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
