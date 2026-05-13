"use client";

import { FileX } from "lucide-react";
import { ListingDocumentsPanel } from "@/components/organisms/ListingDocumentsPanel";

interface Step6DocumentsProps {
  listingId: string | null;
}

export function Step6Documents({ listingId }: Step6DocumentsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Attach supporting documents (title deed, floor plan, etc.).
        </p>
      </div>

      {!listingId ? (
        <div className="rounded-md border border-dashed p-8 flex flex-col items-center gap-3 text-center">
          <FileX className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Documents unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Save the listing first — you'll be redirected here to attach documents.
            </p>
          </div>
        </div>
      ) : (
        <ListingDocumentsPanel listingId={listingId} />
      )}
    </div>
  );
}
