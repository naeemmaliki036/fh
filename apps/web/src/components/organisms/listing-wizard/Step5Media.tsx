"use client";

import { ImageOff } from "lucide-react";
import { ListingMediaPanel } from "@/components/organisms/ListingMediaPanel";

interface Step5MediaProps {
  listingId: string | null;
  propertyId: string | null;
  heroMediaId: string | null;
}

export function Step5Media({ listingId, propertyId, heroMediaId }: Step5MediaProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Media</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload images and videos for the listing.
        </p>
      </div>

      {!listingId ? (
        <div className="rounded-md border border-dashed p-8 flex flex-col items-center gap-3 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Media unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Save the listing first — you&apos;ll be redirected here to upload media.
            </p>
          </div>
        </div>
      ) : (
        <ListingMediaPanel
          listingId={listingId}
          propertyId={propertyId ?? ""}
          heroMediaId={heroMediaId}
        />
      )}
    </div>
  );
}
