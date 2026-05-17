"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { useUploadMedia, useDeleteMedia, useReorderMedia } from "@/hooks/mutations/useListingMedia";
import type { ConsumerListingMediaItem } from "@fh/portal-types";

const MAX_PHOTOS = 20;

interface Props {
  listingId: string;
  media: ConsumerListingMediaItem[];
  onMediaChange: (media: ConsumerListingMediaItem[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
  isSaving?: boolean;
}

export function StepPhotos({ listingId, media, onMediaChange, onNext, onBack, onSaveDraft, isSaving }: Props): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMut = useUploadMedia(listingId);
  const deleteMut = useDeleteMedia(listingId);
  const reorderMut = useReorderMedia(listingId);

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files) return;
    const remaining = MAX_PHOTOS - media.length;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    for (const file of toUpload) {
      const item = await uploadMut.mutateAsync(file);
      onMediaChange([...media, item]);
    }
    setUploading(false);
  }

  function handleDelete(id: string): void {
    deleteMut.mutate(id, {
      onSuccess: () => {
        const updated = media.filter((m) => m.id !== id);
        onMediaChange(updated);
      },
    });
  }

  function move(index: number, direction: -1 | 1): void {
    const next = [...media];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    // Update positions
    const reordered = next.map((m, i) => ({ ...m, position: i }));
    onMediaChange(reordered);
    reorderMut.mutate(reordered.map((m) => m.id));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Photos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload up to {MAX_PHOTOS} photos. First photo is the cover.
        </p>
      </div>

      {/* Upload zone */}
      <button
        type="button"
        disabled={uploading || media.length >= MAX_PHOTOS}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border-2 border-dashed border-slate-200 py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-teal-300 hover:text-teal-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <ImagePlus className="h-6 w-6" />
        )}
        <span className="text-sm font-semibold">
          {uploading ? "Uploading…" : media.length >= MAX_PHOTOS ? "Maximum photos reached" : "Click to upload photos"}
        </span>
        <span className="text-xs">{media.length}/{MAX_PHOTOS} uploaded</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Thumbnails */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, idx) => (
            <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square bg-slate-100 group">
              <img src={item.url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
              {/* Cover badge */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 rounded-full bg-teal-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Cover
                </span>
              )}
              {/* Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-lg bg-white/90 p-1.5 disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === media.length - 1}
                  className="rounded-lg bg-white/90 p-1.5 disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteMut.isPending}
                  className="rounded-lg bg-red-500 p-1.5 text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 min-w-[120px] rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          Back
        </button>
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="flex-1 min-w-[120px] rounded-xl border border-teal-300 py-3 text-sm font-bold text-teal-700 hover:bg-teal-50 transition disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save draft & exit"}
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="flex-1 min-w-[120px] rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-700 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
