"use client";

import { useState } from "react";
import { Trash2, ChevronUp, ChevronDown, Pencil, Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaKindBadge } from "@/components/atoms/MediaKindBadge";
import { useUpdateMedia, useDeleteMedia, useReorderMedia } from "@/hooks/mutations/useMediaMutations";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { cn } from "@/lib/utils/cn";
import type { Media } from "@/lib/types/media";

interface MediaCardProps {
  media: Media;
  propertyId: string;
  isFirst: boolean;
  isLast: boolean;
  allIds: string[];
  isPrimary: boolean;
  onSetPrimary: () => void;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function MediaCard({
  media,
  propertyId,
  isFirst,
  isLast,
  allIds,
  isPrimary,
  onSetPrimary,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: MediaCardProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [altText, setAltText] = useState(media.alt_text ?? "");
  const { mutate: update, isPending: updating } = useUpdateMedia(propertyId);
  const { mutate: remove, isPending: deleting } = useDeleteMedia(propertyId);
  const { mutate: reorder } = useReorderMedia(propertyId);

  const saveAlt = (): void => {
    update({ id: media.id, alt_text: altText || null });
    setEditing(false);
  };

  const move = (direction: "up" | "down"): void => {
    const idx = allIds.indexOf(media.id);
    if (idx < 0) return;
    const next = [...allIds];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    reorder(next);
  };

  const isImage = media.mime_type.startsWith("image/");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative rounded-md border bg-card overflow-hidden transition-all cursor-grab active:cursor-grabbing",
        isDragOver && "ring-2 ring-primary border-primary",
        isPrimary && "ring-2 ring-yellow-400",
      )}
    >
      {/* Primary badge */}
      {isPrimary && (
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 rounded bg-yellow-400/90 px-1 py-0.5">
          <Star className="h-3 w-3 text-yellow-900 fill-yellow-900" />
          <span className="text-[10px] font-semibold text-yellow-900 leading-none">Primary</span>
        </div>
      )}

      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {isImage
          ? <img src={media.url} alt={media.alt_text ?? ""} className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground p-4">
              <MediaKindBadge kind={media.kind} />
              <span className="text-xs truncate max-w-full px-2">{media.storage_key.split("/").pop()}</span>
            </div>
          )
        }
      </div>

      <div className="p-2 space-y-1.5">
        {editing ? (
          <div className="flex gap-1">
            <Input
              value={altText}
              onChange={e => setAltText(e.target.value)}
              className="h-7 text-xs flex-1"
              placeholder="Alt text"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveAlt} disabled={updating} aria-label="Save alt text">
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)} aria-label="Cancel editing">
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-muted-foreground truncate flex-1">{media.alt_text || "no alt text"}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)} aria-label="Edit alt text">
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex gap-1 justify-between items-center">
          {/* Set as primary star */}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-6 w-6",
              isPrimary ? "text-yellow-500 cursor-default" : "text-muted-foreground hover:text-yellow-500",
            )}
            disabled={isPrimary}
            onClick={onSetPrimary}
            aria-label={isPrimary ? "Primary image" : "Set as primary"}
            title={isPrimary ? "Primary image" : "Set as primary"}
          >
            <Star className={cn("h-3 w-3", isPrimary && "fill-current")} />
          </Button>

          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={isFirst} onClick={() => move("up")} aria-label="Move up">
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={isLast} onClick={() => move("down")} aria-label="Move down">
              <ChevronDown className="h-3 w-3" />
            </Button>
            <ConfirmDialog
              title="Remove media?"
              description="This will permanently delete the file. This action cannot be undone."
              confirmLabel="Remove"
              variant="destructive"
              onConfirm={() => remove(media.id)}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={deleting}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
