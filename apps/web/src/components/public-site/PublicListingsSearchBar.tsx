"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { PublicListingsParams } from "@/lib/types/public-site";
import { useLocationData } from "@/hooks/useLocationData";
import { SearchSegment, type SegmentOption } from "./SearchSegment";
import {
  PublicListingsAdvancedFilters,
  type AdvancedFilterValues,
} from "./PublicListingsAdvancedFilters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PURPOSE_OPTIONS: SegmentOption[] = [
  { value: "", label: "All" },
  { value: "sale", label: "Buy" },
  { value: "rent_long", label: "Rent" },
];

const DEBOUNCE_MS = 400;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildParams(c: string, ar: string, p: string, adv: AdvancedFilterValues): PublicListingsParams {
  return {
    page: 1,
    city: c || null,
    area: ar || null,
    purpose: p || null,
    property_type: adv.propertyType || null,
    beds: adv.beds !== "" ? Number(adv.beds) : null,
    baths: adv.baths !== "" ? Number(adv.baths) : null,
    min_price: adv.minPrice !== "" ? Number(adv.minPrice) : null,
    max_price: adv.maxPrice !== "" ? Number(adv.maxPrice) : null,
    furnishing_status: adv.furnishing || null,
    completion_status: adv.completion || null,
    view_orientation: adv.views.length > 0 ? adv.views[0] : null,
    amenities: adv.amenities.length > 0 ? adv.amenities.join(",") : null,
    is_verified: adv.isVerified ? true : null,
    rent_cheque_count: adv.rentChequeCount !== "" ? Number(adv.rentChequeCount) : null,
    has_floor_plan: adv.hasFloorPlan ? true : null,
  };
}

function buildSearchParams(c: string, ar: string, p: string, adv: AdvancedFilterValues): URLSearchParams {
  const sp = new URLSearchParams();
  if (c) sp.set("city", c);
  if (ar) sp.set("area", ar);
  if (p) sp.set("purpose", p);
  if (adv.propertyType) sp.set("property_type", adv.propertyType);
  if (adv.beds !== "") sp.set("beds", adv.beds);
  if (adv.baths !== "") sp.set("baths", adv.baths);
  if (adv.minPrice !== "") sp.set("min_price", adv.minPrice);
  if (adv.maxPrice !== "") sp.set("max_price", adv.maxPrice);
  if (adv.furnishing) sp.set("furnishing_status", adv.furnishing);
  if (adv.completion) sp.set("completion_status", adv.completion);
  if (adv.views.length > 0) sp.set("view_orientation", adv.views[0]);
  if (adv.amenities.length > 0) sp.set("amenities", adv.amenities.join(","));
  if (adv.isVerified) sp.set("is_verified", "true");
  if (adv.rentChequeCount !== "") sp.set("rent_cheque_count", adv.rentChequeCount);
  if (adv.hasFloorPlan) sp.set("has_floor_plan", "true");
  return sp;
}

function emptyAdv(): AdvancedFilterValues {
  return { propertyType: "", beds: "", baths: "", minPrice: "", maxPrice: "", furnishing: "", completion: "", views: [], amenities: [], isVerified: false, rentChequeCount: "", hasFloorPlan: false };
}

function advFromSearchParams(sp: URLSearchParams): AdvancedFilterValues {
  return {
    propertyType: sp.get("property_type") ?? "",
    beds: sp.get("beds") ?? "",
    baths: sp.get("baths") ?? "",
    minPrice: sp.get("min_price") ?? "",
    maxPrice: sp.get("max_price") ?? "",
    furnishing: sp.get("furnishing_status") ?? "",
    completion: sp.get("completion_status") ?? "",
    views: sp.get("view_orientation") ? [sp.get("view_orientation")!] : [],
    amenities: sp.get("amenities") ? sp.get("amenities")!.split(",").filter(Boolean) : [],
    isVerified: sp.get("is_verified") === "true",
    rentChequeCount: sp.get("rent_cheque_count") ?? "",
    hasFloorPlan: sp.get("has_floor_plan") === "true",
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PublicListingsSearchBarProps {
  onFilter: (params: PublicListingsParams) => void;
  operatingCountries?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PublicListingsSearchBar({
  onFilter,
  operatingCountries = [],
}: PublicListingsSearchBarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { citiesByCountry, areasByCity } = useLocationData();
  const primaryCountry = operatingCountries[0] ?? "AE";
  const cityOptions: SegmentOption[] = [
    { value: "", label: "All cities" },
    ...(citiesByCountry[primaryCountry] ?? []),
  ];

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [area, setArea] = useState(searchParams.get("area") ?? "");
  const [purpose, setPurpose] = useState(searchParams.get("purpose") ?? "");
  const [adv, setAdv] = useState<AdvancedFilterValues>(() => advFromSearchParams(searchParams));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const advDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mappedAreas: SegmentOption[] | undefined = city ? areasByCity[city] : undefined;
  const hasAreaDropdown = mappedAreas !== undefined && mappedAreas.length > 0;
  const areaOptions: SegmentOption[] = hasAreaDropdown
    ? [{ value: "", label: "All areas" }, ...mappedAreas]
    : [];

  const handleCityChange = (v: string): void => { setCity(v); setArea(""); };

  const apply = useCallback(
    (c: string, ar: string, p: string, a: AdvancedFilterValues): void => {
      const sp = buildSearchParams(c, ar, p, a);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      onFilter(buildParams(c, ar, p, a));
    },
    [router, pathname, onFilter],
  );

  const scheduleApply = useCallback(
    (c: string, ar: string, p: string, a: AdvancedFilterValues): void => {
      if (advDebounce.current) clearTimeout(advDebounce.current);
      advDebounce.current = setTimeout(() => apply(c, ar, p, a), DEBOUNCE_MS);
    },
    [apply],
  );

  useEffect(() => {
    const sp = searchParams;
    const hasAny = sp.get("city") || sp.get("area") || sp.get("purpose") ||
      sp.get("property_type") || sp.get("beds") || sp.get("baths") ||
      sp.get("min_price") || sp.get("max_price") ||
      sp.get("furnishing_status") || sp.get("completion_status") ||
      sp.get("view_orientation") || sp.get("amenities");
    if (hasAny) {
      onFilter(buildParams(sp.get("city") ?? "", sp.get("area") ?? "", sp.get("purpose") ?? "", advFromSearchParams(sp)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdvChange = (next: AdvancedFilterValues): void => {
    setAdv(next);
    if (advDebounce.current) clearTimeout(advDebounce.current);
    advDebounce.current = setTimeout(() => apply(city, area, purpose, next), DEBOUNCE_MS);
  };

  const handleSearch = (): void => {
    if (advDebounce.current) clearTimeout(advDebounce.current);
    apply(city, area, purpose, adv);
  };

  const hasFilters =
    city || area || purpose ||
    adv.propertyType || adv.beds !== "" || adv.baths !== "" ||
    adv.minPrice !== "" || adv.maxPrice !== "" ||
    adv.furnishing || adv.completion ||
    adv.views.length > 0 || adv.amenities.length > 0 ||
    adv.isVerified || adv.rentChequeCount !== "" || adv.hasFloorPlan;

  const clearAll = (): void => {
    setCity(""); setArea(""); setPurpose(""); setAdv(emptyAdv());
    router.replace(pathname, { scroll: false });
    onFilter({ page: 1 });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col items-stretch gap-0 rounded-full border border-border bg-card shadow-card-md sm:flex-row sm:items-center sm:gap-0 sm:p-1.5">
        <SearchSegment
          label="City"
          value={city}
          placeholder="All cities"
          options={cityOptions}
          onChange={(v) => { handleCityChange(v); apply(v, "", purpose, adv); }}
        />
        <div className="hidden h-8 w-px shrink-0 bg-border sm:block" />
        {hasAreaDropdown ? (
          <SearchSegment
            label="Area"
            value={area}
            placeholder="All areas"
            options={areaOptions}
            disabled={!city}
            onChange={(v) => { setArea(v); apply(city, v, purpose, adv); }}
          />
        ) : (
          <SearchSegment
            label="Area"
            value={area}
            placeholder={city ? "Type area..." : "Select city first"}
            options={[]}
            disabled={!city}
            freeText
            onChange={(v) => { setArea(v); scheduleApply(city, v, purpose, adv); }}
          />
        )}
        <div className="hidden h-8 w-px shrink-0 bg-border sm:block" />
        <SearchSegment
          label="Buy or Rent?"
          value={purpose}
          placeholder="All"
          options={PURPOSE_OPTIONS}
          onChange={(v) => { setPurpose(v); apply(city, area, v, adv); }}
        />
        <div className="flex shrink-0 items-center gap-2 p-1.5 sm:p-0">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full rounded-full bg-slate-950 px-6 py-2.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
          >
            Search
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 px-1">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          {showAdvanced ? "Hide filters" : "More filters"}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {showAdvanced && (
        <PublicListingsAdvancedFilters values={adv} onChange={handleAdvChange} purpose={purpose} />
      )}
    </div>
  );
}
