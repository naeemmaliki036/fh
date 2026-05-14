"use client";

import { useRef, useState } from "react";
import { usePropertyMedia } from "@/hooks/queries/useProperties";
import { useReorderMedia } from "@/hooks/mutations/useMediaMutations";
import { MediaUploader } from "@/components/molecules/MediaUploader";
import { MediaCard } from "@/components/molecules/MediaCard";

interface PropertyMediaGalleryProps {
  propertyId: string;
}

export function PropertyMediaGallery({ propertyId }: PropertyMediaGalleryProps): React.ReactElement {
  const { data: media, isLoading, error } = usePropertyMedia(propertyId);
  const { mutate: reorder } = useReorderMedia(propertyId);

  // id of the card currently being dragged
  const dragId = useRef<string | null>(null);
  // id of the card the dragged card is hovering over
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sorted = [...(media ?? [])].sort((a, b) => a.ordering - b.ordering);
  const allIds = sorted.map(m => m.id);

  const handleDragStart = (id: string) =>
    (e: React.DragEvent<HTMLDivElement>): void => {
      dragId.current = id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    };

  const handleDragOver = (id: string) =>
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragId.current !== id) setDragOverId(id);
    };

  const handleDragLeave = (id: string) =>
    (_e: React.DragEvent<HTMLDivElement>): void => {
      setDragOverId(prev => (prev === id ? null : prev));
    };

  const handleDrop = (targetId: string) =>
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = dragId.current;
      dragId.current = null;
      if (!sourceId || sourceId === targetId) return;

      const next = [...allIds];
      const fromIdx = next.indexOf(sourceId);
      const toIdx = next.indexOf(targetId);
      if (fromIdx < 0 || toIdx < 0) return;

      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, sourceId);
      reorder(next);
    };

  const handleSetPrimary = (id: string): void => {
    const next = [id, ...allIds.filter(x => x !== id)];
    reorder(next);
  };

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

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        onDragEnd={() => { dragId.current = null; setDragOverId(null); }}
      >
        {sorted.map((m, idx) => (
          <MediaCard
            key={m.id}
            media={m}
            propertyId={propertyId}
            isFirst={idx === 0}
            isLast={idx === sorted.length - 1}
            allIds={allIds}
            isPrimary={idx === 0}
            onSetPrimary={() => handleSetPrimary(m.id)}
            isDragOver={dragOverId === m.id}
            onDragStart={handleDragStart(m.id)}
            onDragOver={handleDragOver(m.id)}
            onDragLeave={handleDragLeave(m.id)}
            onDrop={handleDrop(m.id)}
          />
        ))}
      </div>
    </div>
  );
}
