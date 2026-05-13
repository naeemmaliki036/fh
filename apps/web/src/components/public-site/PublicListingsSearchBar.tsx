"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { PublicListingsParams } from "@/lib/types/public-site";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PURPOSES = [
  { value: "", label: "All" },
  { value: "sale", label: "Sale" },
  { value: "rent_long", label: "Rent (long)" },
  { value: "rent_short", label: "Rent (short)" },
] as const;

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

const DEBOUNCE_MS = 400;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildParams(sp: URLSearchParams): PublicListingsParams {
  const beds = sp.get("beds");
  const minP = sp.get("min_price");
  const maxP = sp.get("max_price");
  return {
    q: sp.get("q") ?? undefined,
    purpose: sp.get("purpose") ?? undefined,
    property_type: sp.get("property_type") ?? undefined,
    beds: beds !== null ? Number(beds) : undefined,
    min_price: minP !== null ? Number(minP) : undefined,
    max_price: maxP !== null ? Number(maxP) : undefined,
    city: sp.get("city") ?? undefined,
    page: 1,
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PublicListingsSearchBarProps {
  onFilter: (params: PublicListingsParams) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PublicListingsSearchBar({
  onFilter,
}: PublicListingsSearchBarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [purpose, setPurpose] = useState(searchParams.get("purpose") ?? "");
  const [propertyType, setPropertyType] = useState(searchParams.get("property_type") ?? "");
  const [beds, setBeds] = useState(searchParams.get("beds") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push state to URL and notify parent on any filter change
  const applyFilters = useCallback(
    (overrides: {
      q?: string;
      purpose?: string;
      propertyType?: string;
      beds?: string;
      minPrice?: string;
      maxPrice?: string;
      city?: string;
    }) => {
      const next = new URLSearchParams();
      const vals = {
        q,
        purpose,
        propertyType,
        beds,
        minPrice,
        maxPrice,
        city,
        ...overrides,
      };
      if (vals.q) next.set("q", vals.q);
      if (vals.purpose) next.set("purpose", vals.purpose);
      if (vals.propertyType) next.set("property_type", vals.propertyType);
      if (vals.beds !== "") next.set("beds", vals.beds);
      if (vals.minPrice !== "") next.set("min_price", vals.minPrice);
      if (vals.maxPrice !== "") next.set("max_price", vals.maxPrice);
      if (vals.city) next.set("city", vals.city);

      router.replace(`${pathname}?${next.toString()}`, { scroll: false });

      const sp = next;
      onFilter(buildParams(sp));
    },
    [q, purpose, propertyType, beds, minPrice, maxPrice, city, router, pathname, onFilter],
  );

  // Debounce text inputs
  const scheduleApply = useCallback(
    (overrides: Parameters<typeof applyFilters>[0]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => applyFilters(overrides), DEBOUNCE_MS);
    },
    [applyFilters],
  );

  // Seed from URL on mount
  useEffect(() => {
    const sp = searchParams;
    if (
      sp.get("q") ||
      sp.get("purpose") ||
      sp.get("property_type") ||
      sp.get("beds") ||
      sp.get("min_price") ||
      sp.get("max_price") ||
      sp.get("city")
    ) {
      onFilter(buildParams(sp));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasFilters =
    q || purpose || propertyType || beds !== "" || minPrice !== "" || maxPrice !== "" || city;

  const clearAll = (): void => {
    setQ("");
    setPurpose("");
    setPropertyType("");
    setBeds("");
    setMinPrice("");
    setMaxPrice("");
    setCity("");
    router.replace(pathname, { scroll: false });
    onFilter({ page: 1 });
  };

  return (
    <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      {/* Row 1: text search */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search listings..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              scheduleApply({ q: e.target.value });
            }}
            className="flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Row 2: filter chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {/* Purpose */}
        <select
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
            applyFilters({ purpose: e.target.value });
          }}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100"
        >
          {PURPOSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Property type */}
        <select
          value={propertyType}
          onChange={(e) => {
            setPropertyType(e.target.value);
            applyFilters({ propertyType: e.target.value });
          }}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100"
        >
          {PROPERTY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Bedrooms */}
        <select
          value={beds}
          onChange={(e) => {
            setBeds(e.target.value);
            applyFilters({ beds: e.target.value });
          }}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100"
        >
          {BED_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Min price */}
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          min={0}
          onChange={(e) => {
            setMinPrice(e.target.value);
            scheduleApply({ minPrice: e.target.value });
          }}
          className="w-28 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 transition hover:bg-slate-100"
        />

        {/* Max price */}
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          min={0}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            scheduleApply({ maxPrice: e.target.value });
          }}
          className="w-28 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 transition hover:bg-slate-100"
        />

        {/* City */}
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            scheduleApply({ city: e.target.value });
          }}
          className="w-28 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 transition hover:bg-slate-100"
        />
      </div>
    </div>
  );
}
