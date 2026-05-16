"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import type { PublicListingsParams } from "@/lib/types/public-site";
import {
  PublicListingsAdvancedFilters,
  type AdvancedFilterValues,
} from "./PublicListingsAdvancedFilters";
import { FilterPillDropdown } from "./FilterPillDropdown";
import { PropertyTypePanel, BedsBathsPanel, PricePanel } from "./SearchBarFilterPanels";

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 400;

const SORT_OPTIONS: Array<{ value: NonNullable<PublicListingsParams["sort"]>; label: string }> = [
  { value: "created_at_desc", label: "Newest" },
  { value: "verified_first", label: "Verified first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function emptyAdv(): AdvancedFilterValues {
  return {
    propertyType: "", beds: "", baths: "", minPrice: "", maxPrice: "",
    furnishing: "", completion: "", views: [], amenities: [],
    isVerified: false, rentChequeCount: "", hasFloorPlan: false,
  };
}

function advFromSP(sp: URLSearchParams): AdvancedFilterValues {
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

function buildParams(adv: AdvancedFilterValues, purpose: string, sort: string, furnishing: string): PublicListingsParams {
  return {
    page: 1,
    purpose: purpose || null,
    property_type: adv.propertyType || null,
    beds: adv.beds !== "" ? Number(adv.beds) : null,
    baths: adv.baths !== "" ? Number(adv.baths) : null,
    min_price: adv.minPrice !== "" ? Number(adv.minPrice) : null,
    max_price: adv.maxPrice !== "" ? Number(adv.maxPrice) : null,
    furnishing_status: furnishing || adv.furnishing || null,
    completion_status: adv.completion || null,
    view_orientation: adv.views[0] ?? null,
    amenities: adv.amenities.length > 0 ? adv.amenities.join(",") : null,
    is_verified: adv.isVerified ? true : null,
    rent_cheque_count: adv.rentChequeCount !== "" ? Number(adv.rentChequeCount) : null,
    has_floor_plan: adv.hasFloorPlan ? true : null,
    sort: (sort || null) as PublicListingsParams["sort"],
  };
}

function buildSP(adv: AdvancedFilterValues, purpose: string, sort: string, furnishing: string): URLSearchParams {
  const sp = new URLSearchParams();
  if (purpose) sp.set("purpose", purpose);
  if (adv.propertyType) sp.set("property_type", adv.propertyType);
  if (adv.beds !== "") sp.set("beds", adv.beds);
  if (adv.baths !== "") sp.set("baths", adv.baths);
  if (adv.minPrice !== "") sp.set("min_price", adv.minPrice);
  if (adv.maxPrice !== "") sp.set("max_price", adv.maxPrice);
  const fur = furnishing || adv.furnishing;
  if (fur) sp.set("furnishing_status", fur);
  if (adv.completion) sp.set("completion_status", adv.completion);
  if (adv.views[0]) sp.set("view_orientation", adv.views[0]);
  if (adv.amenities.length > 0) sp.set("amenities", adv.amenities.join(","));
  if (adv.isVerified) sp.set("is_verified", "true");
  if (adv.rentChequeCount !== "") sp.set("rent_cheque_count", adv.rentChequeCount);
  if (adv.hasFloorPlan) sp.set("has_floor_plan", "true");
  if (sort) sp.set("sort", sort);
  return sp;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PublicListingsSearchBarProps {
  onFilter: (params: PublicListingsParams) => void;
  operatingCountries?: string[];
}

export function PublicListingsSearchBar({ onFilter }: PublicListingsSearchBarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [purpose, setPurpose] = useState(searchParams.get("purpose") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "");
  const [furnishing, setFurnishing] = useState(searchParams.get("furnishing_status") ?? "");
  const [adv, setAdv] = useState<AdvancedFilterValues>(() => advFromSP(searchParams));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback(
    (a: AdvancedFilterValues, p: string, s: string, f: string): void => {
      const sp = buildSP(a, p, s, f);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
      onFilter(buildParams(a, p, s, f));
    },
    [router, pathname, onFilter],
  );

  const schedule = useCallback(
    (a: AdvancedFilterValues, p: string, s: string, f: string): void => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => apply(a, p, s, f), DEBOUNCE_MS);
    },
    [apply],
  );

  useEffect(() => {
    const sp = searchParams;
    const hasAny = sp.get("purpose") || sp.get("property_type") || sp.get("beds") ||
      sp.get("min_price") || sp.get("max_price") || sp.get("sort") ||
      sp.get("furnishing_status") || sp.get("completion_status");
    if (hasAny) {
      onFilter(buildParams(advFromSP(sp), sp.get("purpose") ?? "", sp.get("sort") ?? "", sp.get("furnishing_status") ?? ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAndApply = (patch: { purpose?: string; sort?: string; furnishing?: string }): void => {
    const p = patch.purpose ?? purpose;
    const s = patch.sort ?? sort;
    const f = patch.furnishing ?? furnishing;
    if (patch.purpose !== undefined) setPurpose(p);
    if (patch.sort !== undefined) setSort(s);
    if (patch.furnishing !== undefined) setFurnishing(f);
    apply(adv, p, s, f);
  };

  const setAdvApply = (next: AdvancedFilterValues): void => { setAdv(next); apply(next, purpose, sort, furnishing); };
  const setAdvSchedule = (next: AdvancedFilterValues): void => { setAdv(next); schedule(next, purpose, sort, furnishing); };

  const hasFilters = purpose || adv.propertyType || adv.beds !== "" || adv.baths !== "" ||
    adv.minPrice !== "" || adv.maxPrice !== "" || adv.furnishing ||
    adv.completion || adv.views.length > 0 || adv.amenities.length > 0 ||
    adv.isVerified || adv.rentChequeCount !== "" || adv.hasFloorPlan || sort || furnishing;

  const clearAll = (): void => {
    setPurpose(""); setSort(""); setFurnishing(""); setAdv(emptyAdv());
    router.replace(pathname, { scroll: false });
    onFilter({ page: 1 });
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";
  const purposeLabel = purpose === "sale" ? "Buy" : purpose === "rent_long" ? "Rent" : "Buy / Rent";
  const typeLabel = adv.propertyType ? labelify(adv.propertyType) : "Property type";
  const bedsBathsLabel = adv.beds !== "" || adv.baths !== ""
    ? [adv.beds !== "" ? `${adv.beds === "0" ? "Studio" : adv.beds} bd` : "", adv.baths !== "" ? `${adv.baths} ba` : ""].filter(Boolean).join(" · ")
    : "Beds & Baths";
  const priceLabel = adv.minPrice !== "" || adv.maxPrice !== ""
    ? `${adv.minPrice ? `AED ${Number(adv.minPrice).toLocaleString()}` : "0"} – ${adv.maxPrice ? `AED ${Number(adv.maxPrice).toLocaleString()}` : "any"}`
    : "Price";

  const pillClass = (active: boolean): string =>
    `rounded-full border px-3 py-1 text-xs font-medium transition ${active ? "border-slate-950 bg-slate-950 text-white" : "border-border bg-muted text-foreground hover:border-slate-400"}`;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterPillDropdown label={purposeLabel} active={!!purpose}>
          {[{ value: "", label: "All" }, { value: "sale", label: "Buy" }, { value: "rent_long", label: "Rent" }].map((o) => (
            <button key={o.value} type="button" onClick={() => setAndApply({ purpose: o.value })}
              className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${purpose === o.value ? "font-semibold" : ""}`}>
              {o.label}
            </button>
          ))}
        </FilterPillDropdown>

        <FilterPillDropdown label={typeLabel} active={!!adv.propertyType}>
          <PropertyTypePanel value={adv.propertyType}
            onChange={(v) => setAdvApply({ ...adv, propertyType: v })} />
        </FilterPillDropdown>

        <FilterPillDropdown label={priceLabel} active={adv.minPrice !== "" || adv.maxPrice !== ""}>
          <PricePanel minPrice={adv.minPrice} maxPrice={adv.maxPrice}
            onChange={(patch) => setAdvSchedule({ ...adv, ...patch })} />
        </FilterPillDropdown>

        <FilterPillDropdown label={bedsBathsLabel} active={adv.beds !== "" || adv.baths !== ""}>
          <BedsBathsPanel adv={adv} onChange={(patch) => setAdvApply({ ...adv, ...patch })} />
        </FilterPillDropdown>

        <FilterPillDropdown label={adv.completion ? labelify(adv.completion) : "Off-plan / Ready"} active={!!adv.completion}>
          {[{ value: "", label: "Any" }, { value: "off_plan", label: "Off-plan" }, { value: "ready", label: "Ready" }].map((o) => (
            <button key={o.value} type="button" onClick={() => setAdvApply({ ...adv, completion: o.value })}
              className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${adv.completion === o.value ? "font-semibold" : ""}`}>
              {o.label}
            </button>
          ))}
        </FilterPillDropdown>

        <FilterPillDropdown label={sortLabel} active={!!sort}>
          {SORT_OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setAndApply({ sort: o.value })}
              className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${sort === o.value ? "font-semibold" : ""}`}>
              {o.label}
            </button>
          ))}
        </FilterPillDropdown>

        <button type="button" onClick={() => setShowAdvanced((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${showAdvanced ? "border-slate-950 bg-slate-950 text-white" : "border-border bg-card text-foreground hover:border-slate-400"}`}>
          <SlidersHorizontal className="h-3.5 w-3.5" /> More filters
        </button>

        {hasFilters && (
          <button type="button" onClick={clearAll} className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Quick furnishing row + sort toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ value: "", label: "All" }, { value: "furnished", label: "Furnished" }, { value: "unfurnished", label: "Unfurnished" }].map((o) => (
          <button key={o.value} type="button" onClick={() => setAndApply({ furnishing: furnishing === o.value ? "" : o.value })}
            className={pillClass(furnishing === o.value)}>
            {o.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <input id="verified-sort" type="checkbox" checked={sort === "verified_first"}
            onChange={(e) => setAndApply({ sort: e.target.checked ? "verified_first" : "" })}
            className="h-3.5 w-3.5 rounded border-border" />
          <label htmlFor="verified-sort" className="cursor-pointer text-xs font-medium text-muted-foreground">
            Show verified first
          </label>
        </div>
      </div>

      {showAdvanced && (
        <PublicListingsAdvancedFilters values={adv} onChange={setAdvSchedule} purpose={purpose} />
      )}
    </div>
  );
}
