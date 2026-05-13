"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { Listing } from "@/lib/types/listing";

interface WizardStatusBannerProps {
  listing: Listing;
}

export function WizardStatusBanner({ listing }: WizardStatusBannerProps): React.ReactElement | null {
  const { status, review_notes } = listing;

  if (status === "pending_review") {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-sky-200 bg-sky-50 dark:bg-sky-950/30 p-3">
        <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
            This listing is pending review
          </p>
          <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
            Fields are read-only while under review.
          </p>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            This listing has been approved
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            Fields are read-only. Use &ldquo;Publish to market&rdquo; on the listing detail page.
          </p>
        </div>
      </div>
    );
  }

  if (status === "changes_requested" && review_notes) {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Changes requested
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{review_notes}</p>
        </div>
      </div>
    );
  }

  return null;
}
