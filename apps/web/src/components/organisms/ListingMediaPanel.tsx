"use client";

import { useRef, useState, type ReactElement } from "react";
import { Star, Trash2, Film, Image as ImageIcon, LayoutTemplate, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePropertyMedia } from "@/hooks/queries/useProperties";
import { useUploadMedia, useDeleteMedia, useUpdateMedia } from "@/hooks/mutations/useMediaMutations";
import { useSetListingHeroMedia } from "@/hooks/mutations/useListingPriceMutations";
import { cn } from "@/lib/utils/cn";
import type { Media, MediaKind } from "@/lib/types/media";

const MAX_VIDEO_COUNT = 2;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm";

const KINDS: { value: MediaKind; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "floorplan", label: "Floorplan" },
];
interface ListingMediaPanelProps {
  listingId: string;
  propertyId: string;
  heroMediaId: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListingMediaPanel({
  listingId,
  propertyId,
  heroMediaId,
}: ListingMediaPanelProps): ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<MediaKind>("image");
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState<string>("");

  const { data: media = [], isLoading } = usePropertyMedia(propertyId);
  const { mutate: upload, isPending: uploading } = useUploadMedia(propertyId);
  const { mutate: remove, isPending: deleting } = useDeleteMedia(propertyId);
  const { mutate: updateMedia } = useUpdateMedia(propertyId);
  const { mutate: setHero, isPending: settingHero } = useSetListingHeroMedia(listingId);

  const videoCount = media.filter((m) => m.mime_type.startsWith("video/")).length;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFileErr(null);
    setSelectedFile(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("video/") && f.size > MAX_VIDEO_BYTES) {
      setFileErr("Video max size is 25 MB");
      return;
    }
    if (f.type.startsWith("video/") && videoCount >= MAX_VIDEO_COUNT) {
      setFileErr("Max 2 videos per listing");
      return;
    }
    setSelectedFile(f);
    setSelectedKind(f.type.startsWith("video/") ? "video" : "image");
  };

  const handleUpload = (): void => {
    if (!selectedFile) return;
    upload(
      { file: selectedFile, kind: selectedKind },
      {
        onSuccess: () => {
          setSelectedFile(null);
          if (fileRef.current) fileRef.current.value = "";
        },
      },
    );
  };

  const sorted = [...media].sort((a, b) => a.ordering - b.ordering);

  return (
    <div className="space-y-4">
      {/* Upload row */}
      <div className="rounded-md border p-4 bg-muted/30 space-y-3">
        <p className="text-sm font-medium">Upload Media</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Kind</label>
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value as MediaKind)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium">File</label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFile}
              className="block w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-input file:text-sm file:bg-background cursor-pointer"
            />
            {fileErr && <p className="text-xs text-destructive">{fileErr}</p>}
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            )}
          </div>
          <Button size="sm" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Images: jpg/png/webp. Videos: mp4/webm, max 25 MB, max 2 per listing. {videoCount}/2 videos used.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading media...</p>}

      {!isLoading && sorted.length === 0 && (
        <div className="py-10 border rounded-md bg-muted/20 text-center text-muted-foreground">
          <p className="text-sm">No media yet. Upload images or videos above.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((m) => {
          const isVideo = m.mime_type.startsWith("video/");
          const isHero = m.id === heroMediaId;

          return (
            <div
              key={m.id}
              className={cn(
                "relative rounded-md border bg-card overflow-hidden",
                isHero && "ring-2 ring-primary",
              )}
            >
              {/* Type badge */}
              <div className="absolute top-1.5 right-1.5 z-10">
                <Badge variant="secondary" className="text-xs gap-1 py-0 px-1.5">
                  {isVideo
                    ? <><Film className="h-3 w-3" />Video</>
                    : <><ImageIcon className="h-3 w-3" />Image</>
                  }
                </Badge>
              </div>

              {/* Thumbnail */}
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {isVideo
                  ? (
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  )
                  : (
                    <img
                      src={m.url}
                      alt={m.alt_text ?? ""}
                      className="w-full h-full object-cover"
                    />
                  )
                }
              </div>

              {/* Actions */}
              <div className="p-2 flex items-center justify-between gap-1">
                {/* Hero button */}
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 text-xs rounded px-1.5 py-0.5 transition-colors",
                    isHero
                      ? "text-amber-600 font-bold"
                      : "text-muted-foreground hover:text-amber-600",
                  )}
                  disabled={isHero || settingHero}
                  onClick={() => setHero({ media_id: m.id })}
                  title={isHero ? "Current hero image" : "Set as hero image"}
                >
                  <Star className={cn("h-3 w-3", isHero && "fill-current text-amber-500")} />
                  Hero
                </button>

                {/* Floor plan button — no badge below, single control */}
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 text-xs rounded px-1.5 py-0.5 border transition-colors",
                    m.is_floor_plan
                      ? "border-blue-500 bg-blue-500 text-white font-bold"
                      : "border-border text-muted-foreground hover:border-blue-400 hover:text-blue-500",
                  )}
                  onClick={() => updateMedia({ id: m.id, is_floor_plan: !m.is_floor_plan })}
                  title={m.is_floor_plan ? "Remove floor plan tag" : "Mark as floor plan"}
                >
                  {m.is_floor_plan
                    ? <><Check className="h-3 w-3" /> Floor plan</>
                    : <><LayoutTemplate className="h-3 w-3" /> Floor plan</>
                  }
                </button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setDeleteTarget(m)}
                  disabled={deleting}
                  aria-label="Remove media"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>

              {/* Alt text inline edit */}
              <div className="group/alt px-2 pb-1.5 flex items-center gap-1">
                {editingAltId === m.id ? (
                  <input
                    autoFocus
                    value={altDraft}
                    onChange={(e) => setAltDraft(e.target.value)}
                    onBlur={() => {
                      updateMedia({ id: m.id, alt_text: altDraft || undefined });
                      setEditingAltId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateMedia({ id: m.id, alt_text: altDraft || undefined });
                        setEditingAltId(null);
                      }
                      if (e.key === "Escape") setEditingAltId(null);
                    }}
                    className="flex-1 text-xs border-b border-primary bg-transparent outline-none text-foreground"
                    placeholder="Alt text..."
                  />
                ) : (
                  <>
                    <p className="flex-1 text-xs text-muted-foreground truncate">
                      {m.alt_text ?? formatBytes(m.size_bytes)}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setEditingAltId(m.id); setAltDraft(m.alt_text ?? ""); }}
                      className="opacity-0 group-hover/alt:opacity-100 transition-opacity"
                      aria-label="Edit alt text"
                    >
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove media?</DialogTitle>
            <DialogDescription>This media will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteTarget) { remove(deleteTarget.id); } setDeleteTarget(null); }}
              disabled={deleting}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
