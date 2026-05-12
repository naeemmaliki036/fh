"use client";

import { useState } from "react";

interface ListingGalleryProps {
  urls: string[];
  title: string;
}

export function ListingGallery({ urls, title }: ListingGalleryProps): React.ReactElement {
  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[2rem] bg-slate-100 text-sm text-slate-400">
        No photos available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-100" style={{ aspectRatio: "16/9" }}>
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
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${
                i === active ? "border-slate-950" : "border-transparent hover:border-slate-300"
              }`}
            >
              <img
                src={url}
                alt={`${title} thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
