"use client";

import { useState, type ReactElement } from "react";
import { useAmenityCatalog } from "@/hooks/queries/useAmenityCatalog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = [
  { value: "", label: "All types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "warehouse", label: "Warehouse" },
  { value: "plot", label: "Plot" },
  { value: "building", label: "Building" },
  { value: "other", label: "Other" },
] as const;

const BED_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 bed" },
  { value: "2", label: "2 beds" },
  { value: "3", label: "3 beds" },
  { value: "4", label: "4 beds" },
  { value: "5", label: "5+ beds" },
] as const;

const BATH_OPTIONS = [
  { value: "", label: "Any baths" },
  { value: "1", label: "1 bath" },
  { value: "2", label: "2 baths" },
  { value: "3", label: "3 baths" },
  { value: "4", label: "4+ baths" },
] as const;

const FURNISHING_OPTIONS = [
  { value: "", label: "Any furnishing" },
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

const COMPLETION_OPTIONS = [
  { value: "", label: "Any" },
  { value: "ready", label: "Ready" },
  { value: "off_plan", label: "Off-plan" },
] as const;

const VIEW_OPTIONS = [
  "sea", "marina", "canal", "lake", "creek",
  "city", "garden", "pool", "golf", "landmark", "partial",
] as const;

const AMENITIES_DEFAULT_LIMIT = 12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdvancedFilterValues {
  propertyType: string;
  beds: string;
  baths: string;
  minPrice: string;
  maxPrice: string;
  furnishing: string;
  completion: string;
  views: string[];
  amenities: string[];
}

interface PublicListingsAdvancedFiltersProps {
  values: AdvancedFilterValues;
  onChange: (values: AdvancedFilterValues) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublicListingsAdvancedFilters({
  values,
  onChange,
}: PublicListingsAdvancedFiltersProps): ReactElement {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const { data: catalog } = useAmenityCatalog();

  const set = (patch: Partial<AdvancedFilterValues>): void =>
    onChange({ ...values, ...patch });

  const toggleView = (v: string): void => {
    const next = values.views.includes(v)
      ? values.views.filter((x) => x !== v)
      : [...values.views, v];
    set({ views: next });
  };

  const toggleAmenity = (key: string): void => {
    const next = values.amenities.includes(key)
      ? values.amenities.filter((k) => k !== key)
      : [...values.amenities, key];
    set({ amenities: next });
  };

  const allAmenityItems = catalog?.categories.flatMap((cat) => cat.items) ?? [];
  const visibleAmenities = showAllAmenities
    ? allAmenityItems
    : allAmenityItems.slice(0, AMENITIES_DEFAULT_LIMIT);

  const selectClass =
    "rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground outline-none transition hover:bg-secondary";

  const inputClass =
    "w-28 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground transition hover:bg-secondary";

  const pillClass = (active: boolean): string =>
    `rounded-full border px-3 py-1 text-sm font-medium cursor-pointer transition-colors ${
      active
        ? "border-slate-950 bg-slate-950 text-white"
        : "border-border bg-muted text-foreground hover:border-slate-400"
    }`;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-card space-y-4">
      {/* Row 1: type, beds, baths, price */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={values.propertyType} onChange={(e) => set({ propertyType: e.target.value })} className={selectClass}>
          {PROPERTY_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        <select value={values.beds} onChange={(e) => set({ beds: e.target.value })} className={selectClass}>
          {BED_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        <select value={values.baths} onChange={(e) => set({ baths: e.target.value })} className={selectClass}>
          {BATH_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        <span className="text-xs text-muted-foreground">Price:</span>
        <input type="number" placeholder="Min" value={values.minPrice} min={0} onChange={(e) => set({ minPrice: e.target.value })} className={inputClass} />
        <span className="text-xs text-muted-foreground">—</span>
        <input type="number" placeholder="Max" value={values.maxPrice} min={0} onChange={(e) => set({ maxPrice: e.target.value })} className={inputClass} />
      </div>

      {/* Row 2: furnishing segmented */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">Furnishing:</span>
        {FURNISHING_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => set({ furnishing: value })}
            className={pillClass(values.furnishing === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Row 3: completion */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">Completion:</span>
        {COMPLETION_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => set({ completion: value })}
            className={pillClass(values.completion === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Row 4: view multi-pill */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-medium">View:</span>
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggleView(v)}
            className={pillClass(values.views.includes(v))}
          >
            {labelify(v)}
          </button>
        ))}
      </div>

      {/* Row 5: amenities multi-pill */}
      {allAmenityItems.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Amenities:</span>
          <div className="flex flex-wrap gap-2">
            {visibleAmenities.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleAmenity(item.key)}
                className={pillClass(values.amenities.includes(item.key))}
              >
                {item.label}
              </button>
            ))}
          </div>
          {allAmenityItems.length > AMENITIES_DEFAULT_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllAmenities((p) => !p)}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              {showAllAmenities ? "Show less" : `Show all (${allAmenityItems.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
