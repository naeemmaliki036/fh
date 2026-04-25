"use client";

import { usePropertyMedia } from "@/hooks/queries/useProperties";
import { MediaUploader } from "@/components/molecules/MediaUploader";
import { MediaCard } from "@/components/molecules/MediaCard";

interface PropertyMediaGalleryProps {
  propertyId: string;
}

export function PropertyMediaGallery({ propertyId }: PropertyMediaGalleryProps): React.ReactElement {
  const { data: media, isLoading, error } = usePropertyMedia(propertyId);

  const sorted = [...(media ?? [])].sort((a, b) => a.ordering - b.ordering);
  const allIds = sorted.map(m => m.id);

  return (
    <div className="space-y-4">
      <MediaUploader propertyId={propertyId} />

      {isLoading && <p className="text-sm text-muted-foreground">Loading media...</p>}
      {error && <p className="text-sm text-destructive">Failed to load media.</p>}

      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-md bg-muted/20">
          <p className="text-sm font-medium">No media yet</p>
          <p className="text-xs mt-1">Upload images, videos or documents above</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((m, idx) => (
          <MediaCard
            key={m.id}
            media={m}
            propertyId={propertyId}
            isFirst={idx === 0}
            isLast={idx === sorted.length - 1}
            allIds={allIds}
          />
        ))}
      </div>
    </div>
  );
}
