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
      <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        No photos available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hero image */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <img
          src={urls[active]}
          alt={`${title} — photo ${active + 1}`}
          className="h-full w-full object-cover"
        />
        {urls.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
            {active + 1} / {urls.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                i === active ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
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
