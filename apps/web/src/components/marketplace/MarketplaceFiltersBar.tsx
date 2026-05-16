"use client";

import { type Dispatch, type SetStateAction } from "react";
import { cn } from "@/lib/utils/cn";
import type { MarketplaceListingsParams } from "@/lib/types/marketplace";

interface MarketplaceFiltersBarProps {
  params: MarketplaceListingsParams;
  onChange: Dispatch<SetStateAction<MarketplaceListingsParams>>;
}

const PURPOSE_OPTIONS = [
  { value: "", label: "All" },
  { value: "sale", label: "Buy" },
  { value: "rent_long", label: "Rent" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "land", label: "Land" },
  { value: "office", label: "Office" },
];

const SORT_OPTIONS = [
  { value: "verified_first", label: "Verified first" },
  { value: "created_at_desc", label: "Newest" },
  { value: "price_asc", label: "Price: Low" },
  { value: "price_desc", label: "Price: High" },
];

const BEDS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

const FURNISHING_OPTIONS = [
  { value: "", label: "Any" },
  { value: "furnished", label: "Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "partly_furnished", label: "Partly" },
];

const COMPLETION_OPTIONS = [
  { value: "", label: "Any" },
  { value: "ready", label: "Ready" },
  { value: "off_plan", label: "Off-plan" },
];

function PillSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition",
          "min-w-[100px] cursor-pointer",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function MarketplaceFiltersBar({
  params,
  onChange,
}: MarketplaceFiltersBarProps): React.ReactElement {
  const set = <K extends keyof MarketplaceListingsParams>(
    key: K,
    val: MarketplaceListingsParams[K],
  ): void => {
    onChange((prev) => ({ ...prev, [key]: val || undefined, page: 1 }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-end gap-3 shadow-sm">
      <PillSelect
        label="Purpose"
        value={params.purpose ?? ""}
        options={PURPOSE_OPTIONS}
        onChange={(v) => set("purpose", v)}
      />
      <PillSelect
        label="Type"
        value={params.property_type ?? ""}
        options={TYPE_OPTIONS}
        onChange={(v) => set("property_type", v)}
      />
      <PillSelect
        label="Beds"
        value={params.beds != null ? String(params.beds) : ""}
        options={BEDS_OPTIONS}
        onChange={(v) => set("beds", v ? Number(v) : undefined)}
      />
      <PillSelect
        label="Furnishing"
        value={params.furnishing_status ?? ""}
        options={FURNISHING_OPTIONS}
        onChange={(v) => set("furnishing_status", v)}
      />
      <PillSelect
        label="Status"
        value={params.completion_status ?? ""}
        options={COMPLETION_OPTIONS}
        onChange={(v) => set("completion_status", v)}
      />
      <PillSelect
        label="Sort"
        value={params.sort ?? "verified_first"}
        options={SORT_OPTIONS}
        onChange={(v) => set("sort", v as MarketplaceListingsParams["sort"])}
      />

      {/* Verified toggle */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">Verified</label>
        <button
          onClick={() => set("is_verified", params.is_verified ? undefined : true)}
          className={cn(
            "h-9 rounded-lg border px-3 text-sm font-semibold transition",
            params.is_verified
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
          )}
        >
          Verified only
        </button>
      </div>

      {/* Search input */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-[160px]">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">Search</label>
        <input
          type="text"
          placeholder="City, area or keyword..."
          value={params.q ?? ""}
          onChange={(e) => set("q", e.target.value || undefined)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>
    </div>
  );
}
