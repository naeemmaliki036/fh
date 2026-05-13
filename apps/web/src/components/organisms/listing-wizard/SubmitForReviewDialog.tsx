"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEligibleReviewers } from "@/hooks/queries/useListings";
import { useSubmitForReview } from "@/hooks/mutations/useListingReviewMutations";

interface SubmitForReviewDialogProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitForReviewDialog({
  listingId,
  open,
  onOpenChange,
}: SubmitForReviewDialogProps): React.ReactElement {
  const router = useRouter();
  const [reviewerId, setReviewerId] = useState("");
  const [note, setNote] = useState("");

  const { data: reviewersData, isLoading: loadingReviewers } = useEligibleReviewers();
  const reviewers = reviewersData?.items ?? [];

  const { mutateAsync: submit, isPending } = useSubmitForReview(listingId);

  const handleSubmit = async (): Promise<void> => {
    if (!reviewerId) return;
    await submit({ reviewer_id: reviewerId, note: note || null });
    onOpenChange(false);
    router.push(`/listings/${listingId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Reviewer</Label>
            <Select value={reviewerId} onValueChange={setReviewerId} disabled={loadingReviewers}>
              <SelectTrigger>
                <SelectValue placeholder={loadingReviewers ? "Loading…" : "Select reviewer"} />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name} <span className="text-muted-foreground ml-1">({u.role})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reviewers.length === 0 && !loadingReviewers && (
              <p className="text-xs text-muted-foreground">
                No eligible reviewers found (listing_manager, company_admin, company_owner).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review-note">Note (optional)</Label>
            <textarea
              id="review-note"
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any context for the reviewer…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/1000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reviewerId || isPending}>
            {isPending ? "Submitting…" : "Submit for Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
