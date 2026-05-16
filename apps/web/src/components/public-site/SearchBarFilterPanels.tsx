"use client";

import type { AdvancedFilterValues } from "./PublicListingsAdvancedFilters";

const BED_OPTIONS = ["0", "1", "2", "3", "4", "5"] as const;
const BED_LABELS: Record<string, string> = {
  "0": "Studio", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5+",
};

const PROPERTY_TYPES = [
  "apartment", "villa", "townhouse", "penthouse",
  "office", "retail", "warehouse", "plot", "building",
] as const;

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pillClass(active: boolean): string {
  return `rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
    active ? "border-slate-950 bg-slate-950 text-white" : "border-border hover:border-slate-400"
  }`;
}

interface PropertyTypePanelProps {
  value: string;
  onChange: (v: string) => void;
}

export function PropertyTypePanel({ value, onChange }: PropertyTypePanelProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5 max-w-[240px]">
      {PROPERTY_TYPES.map((t) => (
        <button key={t} type="button" onClick={() => onChange(value === t ? "" : t)}
          className={pillClass(value === t)}>
          {labelify(t)}
        </button>
      ))}
    </div>
  );
}

interface BedsBathsPanelProps {
  adv: AdvancedFilterValues;
  onChange: (patch: Partial<AdvancedFilterValues>) => void;
}

export function BedsBathsPanel({ adv, onChange }: BedsBathsPanelProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Bedrooms</p>
        <div className="flex flex-wrap gap-1">
          {BED_OPTIONS.map((b) => (
            <button key={b} type="button"
              onClick={() => onChange({ beds: adv.beds === b ? "" : b })}
              className={pillClass(adv.beds === b)}>
              {BED_LABELS[b]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Bathrooms</p>
        <div className="flex flex-wrap gap-1">
          {(["1", "2", "3", "4"] as const).map((b) => (
            <button key={b} type="button"
              onClick={() => onChange({ baths: adv.baths === b ? "" : b })}
              className={pillClass(adv.baths === b)}>
              {b}{b === "4" ? "+" : ""}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PricePanelProps {
  minPrice: string;
  maxPrice: string;
  onChange: (patch: { minPrice?: string; maxPrice?: string }) => void;
}

export function PricePanel({ minPrice, maxPrice, onChange }: PricePanelProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <input type="number" placeholder="Min price" value={minPrice}
        onChange={(e) => onChange({ minPrice: e.target.value })}
        className="w-full rounded border border-border px-2 py-1.5 text-sm" />
      <input type="number" placeholder="Max price" value={maxPrice}
        onChange={(e) => onChange({ maxPrice: e.target.value })}
        className="w-full rounded border border-border px-2 py-1.5 text-sm" />
    </div>
  );
}
