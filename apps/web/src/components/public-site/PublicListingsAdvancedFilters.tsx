"use client";

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdvancedFilterValues {
  propertyType: string;
  beds: string;
  minPrice: string;
  maxPrice: string;
}

interface PublicListingsAdvancedFiltersProps {
  values: AdvancedFilterValues;
  onChange: (values: AdvancedFilterValues) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublicListingsAdvancedFilters({
  values,
  onChange,
}: PublicListingsAdvancedFiltersProps): React.ReactElement {
  const set = (patch: Partial<AdvancedFilterValues>): void =>
    onChange({ ...values, ...patch });

  const selectClass =
    "rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground outline-none transition hover:bg-secondary";

  const inputClass =
    "w-28 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground transition hover:bg-secondary";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
      {/* Property type */}
      <select
        value={values.propertyType}
        onChange={(e) => set({ propertyType: e.target.value })}
        className={selectClass}
      >
        {PROPERTY_TYPES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Bedrooms */}
      <select
        value={values.beds}
        onChange={(e) => set({ beds: e.target.value })}
        className={selectClass}
      >
        {BED_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <span className="text-xs text-muted-foreground">Price:</span>

      {/* Min price */}
      <input
        type="number"
        placeholder="Min"
        value={values.minPrice}
        min={0}
        onChange={(e) => set({ minPrice: e.target.value })}
        className={inputClass}
      />

      <span className="text-xs text-muted-foreground">—</span>

      {/* Max price */}
      <input
        type="number"
        placeholder="Max"
        value={values.maxPrice}
        min={0}
        onChange={(e) => set({ maxPrice: e.target.value })}
        className={inputClass}
      />
    </div>
  );
}
