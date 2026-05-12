"use client";

import type { PublicListingsParams } from "@/lib/types/public-site";

interface ListingFiltersProps {
  activeType: string;
  onTypeChange: (type: string) => void;
  params: PublicListingsParams;
  onFilter: (params: PublicListingsParams) => void;
}

const TYPE_PILLS = [
  { value: "", label: "All" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "plot", label: "Plot" },
] as const;

export function ListingFilters({ activeType, onTypeChange, onFilter, params }: ListingFiltersProps): React.ReactElement {
  const handlePill = (value: string): void => {
    onTypeChange(value);
    onFilter({ ...params, property_type: value || null, page: 1 });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full bg-white p-2 shadow-sm">
      {TYPE_PILLS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => handlePill(value)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            activeType === value
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
