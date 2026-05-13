"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPendingReviews } from "@/hooks/queries/useListings";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { formatDate } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";

export default function PendingReviewsPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { data, isLoading, error } = useMyPendingReviews(userId);
  const listings = data?.items ?? [];

  if (!currentUser) {
    return <p className="text-sm text-muted-foreground p-6">Not authenticated.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pending Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Listings assigned to you that are awaiting review.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">Failed to load pending reviews.</p>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="py-14 flex flex-col items-center gap-3 text-center border rounded-md bg-muted/20">
          <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No pending reviews</p>
          <p className="text-xs text-muted-foreground">
            Listings submitted for your review will appear here.
          </p>
        </div>
      )}

      {!isLoading && listings.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Purpose</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Submitted</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-medium truncate block max-w-64">{l.title}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ListingPurposeBadge purpose={l.purpose} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ListingStatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {l.submitted_for_review_at
                      ? formatDate(l.submitted_for_review_at, "en")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/listings/${l.id}/review`}>Review</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
