"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmitForReviewDialog } from "./SubmitForReviewDialog";
import type { WizardFormValues } from "./wizard-schema";
import type { ListingStatus } from "@/lib/types/listing";

interface Step7ReviewProps {
  values: WizardFormValues;
  listingId: string | null;
  status: ListingStatus | null;
  reviewNotes: string | null | undefined;
  onSaveDraft: () => void;
  isSaving: boolean;
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex gap-2 py-2 border-b last:border-0">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">{value ?? <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}

export function Step7Review({
  values,
  listingId,
  status,
  reviewNotes,
  onSaveDraft,
  isSaving,
}: Step7ReviewProps): React.ReactElement {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const canSubmit = (status === null || status === "draft" || status === "changes_requested") && !!listingId;
  const isReadOnly = status === "pending_review" || status === "approved";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Confirm all details before saving or submitting for review.
        </p>
      </div>

      {status === "changes_requested" && reviewNotes && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Changes requested by reviewer</p>
          <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">{reviewNotes}</p>
        </div>
      )}

      <div className="rounded-md border bg-muted/20 px-4 py-1">
        <ReviewRow label="Property ID" value={values.property_id} />
        <ReviewRow label="Purpose" value={values.purpose?.replace("_", " ")} />
        {(values.purpose === "rent_short" || values.purpose === "rent_long") && (
          <ReviewRow label="Rent Period" value={values.rent_period} />
        )}
        <ReviewRow label="Valid From" value={values.valid_from} />
        <ReviewRow label="Valid Until" value={values.valid_until} />
        <ReviewRow label="Price" value={`${values.currency} ${values.price}`} />
        <ReviewRow label="Tier" value={values.listing_tier} />
        <ReviewRow label="Title" value={values.title} />
        <ReviewRow label="Description" value={
          values.description
            ? <span className="line-clamp-3">{values.description}</span>
            : null
        } />
        <ReviewRow label="Tags" value={
          values.tags && values.tags.length > 0
            ? <div className="flex flex-wrap gap-1">
                {values.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            : null
        } />
      </div>

      {!isReadOnly && (
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save as Draft"}
          </Button>
          {canSubmit && (
            <Button
              type="button"
              onClick={() => setShowSubmitDialog(true)}
              disabled={isSaving}
            >
              Submit for Review
            </Button>
          )}
          {!listingId && (
            <p className="text-xs text-muted-foreground self-center">
              Save as draft first to enable review submission.
            </p>
          )}
        </div>
      )}

      {listingId && (
        <SubmitForReviewDialog
          listingId={listingId}
          open={showSubmitDialog}
          onOpenChange={setShowSubmitDialog}
        />
      )}
    </div>
  );
}
