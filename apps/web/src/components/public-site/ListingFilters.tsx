"use client";

import { useState } from "react";
import type { PublicListingsParams } from "@/lib/types/public-site";

interface ListingFiltersProps {
  initialParams?: PublicListingsParams;
  onFilter: (params: PublicListingsParams) => void;
}

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
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
];

const BEDS_OPTIONS = [
  { value: "", label: "Any Beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3", label: "3 Beds" },
  { value: "4", label: "4+ Beds" },
];

export function ListingFilters({ initialParams = {}, onFilter }: ListingFiltersProps): React.ReactElement {
  const [minPrice, setMinPrice] = useState(initialParams.min_price?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(initialParams.max_price?.toString() ?? "");
  const [beds, setBeds] = useState(initialParams.beds?.toString() ?? "");
  const [propertyType, setPropertyType] = useState(initialParams.property_type ?? "");

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onFilter({
      min_price: minPrice ? Number(minPrice) : null,
      max_price: maxPrice ? Number(maxPrice) : null,
      beds: beds !== "" ? Number(beds) : null,
      property_type: propertyType || null,
      page: 1,
    });
  };

  const handleReset = (): void => {
    setMinPrice("");
    setMaxPrice("");
    setBeds("");
    setPropertyType("");
    onFilter({ page: 1 });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Min Price (AED)</label>
        <input
          type="number"
          placeholder="e.g. 500000"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="h-9 w-36 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Max Price (AED)</label>
        <input
          type="number"
          placeholder="e.g. 2000000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="h-9 w-36 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
        <select
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
          className="h-9 w-32 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {BEDS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Type</label>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="h-9 w-36 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PROPERTY_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="h-9 rounded-md border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
