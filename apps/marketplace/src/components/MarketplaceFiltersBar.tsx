"use client";

import { type Dispatch, type SetStateAction } from "react";
import { cn } from "@/lib/cn";
import type { MarketplaceListingsParams } from "@fh/portal-types";

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
  { value: "", label: "Any beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 bed" },
  { value: "2", label: "2 beds" },
  { value: "3", label: "3 beds" },
  { value: "4", label: "4+ beds" },
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
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700",
          "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition",
          "min-w-[110px] cursor-pointer",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
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
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap items-end gap-3 shadow-sm">
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
        label="Sort"
        value={params.sort ?? "verified_first"}
        options={SORT_OPTIONS}
        onChange={(v) => set("sort", v as MarketplaceListingsParams["sort"])}
      />

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
          Verified
        </label>
        <button
          onClick={() => set("is_verified", params.is_verified ? undefined : true)}
          className={cn(
            "h-9 rounded-full border px-4 text-sm font-semibold transition",
            params.is_verified
              ? "bg-teal-600 border-teal-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-700",
          )}
        >
          Verified only
        </button>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
          Search
        </label>
        <input
          type="text"
          placeholder="City, area or keyword..."
          value={params.q ?? ""}
          onChange={(e) => set("q", e.target.value || undefined)}
          className={cn(
            "h-9 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700",
            "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition",
          )}
        />
      </div>
    </div>
  );
}
