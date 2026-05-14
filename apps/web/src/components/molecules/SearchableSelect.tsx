"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { cn } from "@/lib/utils/cn";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  allowFreeText?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  allowFreeText = false,
  className,
}: SearchableSelectProps): ReactElement {
  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? value ?? "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const listId = useRef(`ss-list-${Math.random().toString(36).slice(2)}`).current;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const commit = useCallback(
    (opt: SearchableSelectOption): void => {
      onChange(opt.value);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  const handleFocus = (): void => {
    if (!disabled) {
      setOpen(true);
      setQuery("");
    }
  };

  const handleBlur = (): void => {
    // Give click on list item time to fire before closing
    setTimeout(() => {
      if (
        containerRef.current &&
        !containerRef.current.contains(document.activeElement)
      ) {
        if (allowFreeText && query.trim()) {
          const exact = options.find(
            (o) => o.label.toLowerCase() === query.trim().toLowerCase()
          );
          if (exact) {
            onChange(exact.value);
          } else {
            onChange(query.trim());
          }
        }
        setOpen(false);
        setQuery("");
      }
    }, 150);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) {
        commit(filtered[highlighted]);
      } else if (allowFreeText && query.trim()) {
        onChange(query.trim());
        setOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  const displayValue = open ? query : selectedLabel;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
          "transition-colors placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        role="combobox"
      />

      {open && !disabled && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full max-h-64 overflow-y-auto",
            "rounded-md border border-input bg-popover shadow-md"
          )}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {allowFreeText ? `Use "${query}"` : "No results"}
            </li>
          ) : (
            filtered.map((opt, i) => {
              const isSelected = opt.value === value || opt.label === value;
              const isHigh = i === highlighted;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    commit(opt);
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer select-none",
                    isHigh && "bg-accent text-accent-foreground",
                    !isHigh && "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="text-xs text-muted-foreground">✓</span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
