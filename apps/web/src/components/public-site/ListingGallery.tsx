"use client";

import { useState } from "react";

interface ListingGalleryProps {
  urls: string[];
  title: string;
}

const VISIBLE_THUMBS = 4;

export function ListingGallery({ urls, title }: ListingGalleryProps): React.ReactElement {
  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[2rem] bg-slate-100 text-sm text-slate-400">
        No photos available
      </div>
    );
  }

  const thumbs = urls.slice(0, VISIBLE_THUMBS);
  const hiddenCount = Math.max(0, urls.length - VISIBLE_THUMBS);

  return (
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-slate-100">
        <img
          src={urls[active]}
          alt={`${title} — photo ${active + 1}`}
          className="h-full w-full object-cover"
        />
        {urls.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {active + 1} / {urls.length}
          </span>
        )}
      </div>

      {urls.length > 1 && (
        <div className="grid grid-cols-2 gap-3 content-start">
          {thumbs.map((url, i) => {
            const isMore = i === VISIBLE_THUMBS - 1 && hiddenCount > 0;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-colors ${
                  i === active ? "border-slate-950" : "border-transparent hover:border-slate-300"
                }`}
              >
                <img
                  src={url}
                  alt={`${title} thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                {isMore && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-black text-white">
                    +{hiddenCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
