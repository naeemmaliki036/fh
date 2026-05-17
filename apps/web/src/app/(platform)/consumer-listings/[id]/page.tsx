"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Check, MessageSquare } from "lucide-react";
import { useAdminConsumerListingDetail } from "@/hooks/queries/useAdminConsumerListings";
import { useApproveConsumerListing, useRequestListingChanges } from "@/hooks/mutations/useConsumerListingModeration";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import { Button } from "@/components/ui/button";
import type { ConsumerListingMediaItem } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }): React.ReactElement | null {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground capitalize">
        {String(value).replace(/_/g, " ")}
      </span>
    </div>
  );
}

export default function ConsumerListingDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const { data: listing, isLoading, error } = useAdminConsumerListingDetail(id);
  const approveMut = useApproveConsumerListing();
  const changesMut = useRequestListingChanges();
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-20 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (error || !listing) {
    return <p className="text-sm text-destructive">Failed to load listing.</p>;
  }

  function handleApprove(): void {
    if (!confirm("Approve this listing? The owner will be notified.")) return;
    approveMut.mutate(id, { onSuccess: () => router.replace("/consumer-listings") });
  }

  function handleRequestChanges(): void {
    if (!notes.trim()) {
      setNotesError("Notes are required");
      return;
    }
    if (notes.length > 2000) {
      setNotesError("Notes must be 2000 characters or fewer");
      return;
    }
    setNotesError("");
    changesMut.mutate(
      { id, body: { notes: notes.trim() } },
      { onSuccess: () => router.replace("/consumer-listings") },
    );
  }

  const coverUrl = listing.media?.[0]?.url ?? listing.primary_photo_url;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/consumer-listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to queue
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{listing.title ?? "Untitled listing"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submitted {listing.submitted_at ? formatRelativeTime(listing.submitted_at) : "—"}
          </p>
        </div>
        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 shrink-0">
          {listing.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: media + property details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Media gallery */}
          {listing.media && listing.media.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {listing.media.map((m: ConsumerListingMediaItem, idx: number) => (
                <div key={m.id} className={`relative rounded-xl overflow-hidden bg-muted ${idx === 0 ? "col-span-3 aspect-[3/2]" : "aspect-square"}`}>
                  <img src={m.url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-muted aspect-[3/2] flex items-center justify-center text-muted-foreground text-sm">
              No photos uploaded
            </div>
          )}

          {/* Property details */}
          <div className="rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold mb-3">Property details</h2>
            <DetailRow label="Type" value={listing.property_type} />
            <DetailRow label="Purpose" value={listing.purpose === "sale" ? "For sale" : "For rent"} />
            <DetailRow label="Country" value={listing.country} />
            <DetailRow label="City" value={listing.city} />
            <DetailRow label="Area" value={listing.area} />
            <DetailRow label="Bedrooms" value={listing.bedrooms} />
            <DetailRow label="Bathrooms" value={listing.bathrooms} />
            <DetailRow label="Size (sqft)" value={listing.size_sqft} />
            <DetailRow label="Parking" value={listing.parking_spaces} />
            <DetailRow label="Floor" value={listing.floor_number} />
            <DetailRow label="Furnishing" value={listing.furnishing_status} />
            <DetailRow label="Completion" value={listing.completion_status} />
            <DetailRow label="Ownership" value={listing.ownership_type} />
            <DetailRow label="View" value={listing.view_orientation} />
          </div>

          {listing.description && (
            <div className="rounded-xl border border-border p-4">
              <h2 className="text-sm font-semibold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}
        </div>

        {/* Right: owner + moderation actions */}
        <div className="space-y-5">
          {/* Owner info */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <h2 className="text-sm font-semibold">Owner</h2>
            <p className="text-sm text-foreground">{listing.owner_name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{listing.owner_email}</p>
            {listing.owner_phone && <p className="text-sm text-muted-foreground">{listing.owner_phone}</p>}
          </div>

          {/* Approve */}
          {listing.status === "pending_review" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-emerald-800">Approve listing</h2>
              </div>
              <p className="text-xs text-emerald-700">
                The listing will go live and the owner will be notified by email.
              </p>
              <Button
                onClick={handleApprove}
                disabled={approveMut.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Approve
              </Button>
            </div>
          )}

          {/* Request changes */}
          {(listing.status === "pending_review" || listing.status === "changes_requested") && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Request changes</h2>
              </div>
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesError(""); }}
                  rows={5}
                  maxLength={2000}
                  placeholder="Explain what needs to be fixed or improved…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-between mt-1">
                  {notesError ? (
                    <p className="text-xs text-destructive">{notesError}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground">{notes.length}/2000</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleRequestChanges}
                disabled={changesMut.isPending}
                className="w-full"
              >
                {changesMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send feedback
              </Button>
            </div>
          )}

          {/* Non-reviewable state message */}
          {listing.status !== "pending_review" && listing.status !== "changes_requested" && (
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              This listing is in <strong>{listing.status.replace(/_/g, " ")}</strong> state — no moderation actions available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
