"use client";

import { useState } from "react";

interface ListingGalleryProps {
  allImages: string[];
  title: string;
}

export function ListingGallery({ allImages, title }: ListingGalleryProps): React.ReactElement | null {
  const [imgIdx, setImgIdx] = useState(0);

  if (allImages.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
        <img
          src={allImages[imgIdx] ?? ""}
          alt={title}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white">
          {imgIdx + 1} / {allImages.length}
        </span>
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((url, i) => (
            <button
              key={url}
              onClick={() => setImgIdx(i)}
              className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition ${
                i === imgIdx ? "border-teal-500" : "border-transparent"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
