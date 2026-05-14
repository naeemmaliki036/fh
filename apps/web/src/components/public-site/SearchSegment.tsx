"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SegmentOption {
  value: string;
  label: string;
}

interface SearchSegmentProps {
  label: string;
  value: string;
  placeholder: string;
  options: SegmentOption[];
  disabled?: boolean;
  /** When true, render a free-text input instead of a dropdown list */
  freeText?: boolean;
  onChange: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchSegment({
  label,
  value,
  placeholder,
  options,
  disabled = false,
  freeText = false,
  onChange,
}: SearchSegmentProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayValue =
    value
      ? options.find((o) => o.value === value)?.label ?? value
      : placeholder;

  const isPlaceholder = !value;

  if (freeText) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex min-w-0 flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-0.5 rounded-full px-4 py-2 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className={`truncate text-sm font-medium ${
            isPlaceholder ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {displayValue}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-60 min-w-[200px] overflow-y-auto rounded-2xl border border-border bg-card shadow-card-md">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-muted ${
                opt.value === value ? "font-bold text-foreground" : "text-foreground/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
