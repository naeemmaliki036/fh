"use client";

import { useState } from "react";
import { Trash2, ChevronUp, ChevronDown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaKindBadge } from "@/components/atoms/MediaKindBadge";
import { useUpdateMedia, useDeleteMedia, useReorderMedia } from "@/hooks/mutations/useMediaMutations";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import type { Media } from "@/lib/types/media";

interface MediaCardProps {
  media: Media;
  propertyId: string;
  isFirst: boolean;
  isLast: boolean;
  allIds: string[];
}

export function MediaCard({ media, propertyId, isFirst, isLast, allIds }: MediaCardProps): React.ReactElement {
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
    <div className="relative rounded-md border bg-card overflow-hidden">
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {isImage
          ? <img src={media.url} alt={media.alt_text ?? ""} className="w-full h-full object-cover" />
          : <div className="flex flex-col items-center gap-1 text-muted-foreground p-4">
              <MediaKindBadge kind={media.kind} />
              <span className="text-xs truncate max-w-full px-2">{media.storage_key.split("/").pop()}</span>
            </div>
        }
      </div>
      <div className="p-2 space-y-1.5">
        {editing ? (
          <div className="flex gap-1">
            <Input value={altText} onChange={e => setAltText(e.target.value)} className="h-7 text-xs flex-1" placeholder="Alt text" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveAlt} disabled={updating} aria-label="Save alt text"><Check className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)} aria-label="Cancel editing"><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-muted-foreground truncate flex-1">{media.alt_text || "no alt text"}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)} aria-label="Edit alt text"><Pencil className="h-3 w-3" /></Button>
          </div>
        )}
        <div className="flex gap-1 justify-end">
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={isFirst} onClick={() => move("up")} aria-label="Move up"><ChevronUp className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={isLast} onClick={() => move("down")} aria-label="Move down"><ChevronDown className="h-3 w-3" /></Button>
          <ConfirmDialog
            title="Remove media?"
            description="This will permanently delete the file. This action cannot be undone."
            confirmLabel="Remove"
            variant="destructive"
            onConfirm={() => remove(media.id)}
            trigger={<Button size="icon" variant="ghost" className="h-6 w-6" disabled={deleting}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
          />
        </div>
      </div>
    </div>
  );
}
