"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Store } from "lucide-react";
import { useAdminConsumerListings } from "@/hooks/queries/useAdminConsumerListings";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import type { AdminConsumerListingQueueItem, ConsumerListingStatus } from "@/lib/types";

type TabStatus = ConsumerListingStatus | "all";

const TABS: { value: TabStatus; label: string }[] = [
  { value: "pending_review", label: "Pending review" },
  { value: "active", label: "Active" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "all", label: "All" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_review: "bg-amber-100 text-amber-700",
  changes_requested: "bg-red-100 text-red-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  sold: "bg-slate-100 text-slate-600",
  rented: "bg-blue-100 text-blue-700",
  archived: "bg-red-50 text-red-500",
  expired: "bg-red-50 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "In review",
  changes_requested: "Changes requested",
  active: "Active",
  paused: "Paused",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
  expired: "Expired",
};

export default function ConsumerListingsQueuePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabStatus>("pending_review");
  const params = activeTab === "all" ? {} : { status: activeTab };
  const { data, isLoading, isError } = useAdminConsumerListings(params);
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Store className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consumer Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and moderate owner-posted listings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {isError && <p className="text-sm text-destructive py-10 text-center">Failed to load listings.</p>}

      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-muted-foreground py-10 text-center">
          No listings in this category.
        </p>
      )}

      {items.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Listing</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: AdminConsumerListingQueueItem) => (
                <tr key={item.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.primary_photo_url ? (
                        <img
                          src={item.primary_photo_url}
                          alt={item.title ?? ""}
                          className="h-10 w-14 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded-md bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[200px]">
                          {item.title ?? "Untitled"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.property_type.replace(/_/g, " ")} &middot; {[item.area, item.city].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{item.owner_email}</p>
                    {item.owner_name && <p className="text-xs text-muted-foreground">{item.owner_name}</p>}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {item.currency && item.price != null
                      ? `${item.currency} ${item.price.toLocaleString("en-AE")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[item.status] ?? ""}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {item.submitted_at ? formatRelativeTime(item.submitted_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/consumer-listings/${item.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && (
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
              {data.total} listing{data.total !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
