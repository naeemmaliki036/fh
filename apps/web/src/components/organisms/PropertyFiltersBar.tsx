"use client";

import { useState, useCallback, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/hooks/queries/useAgents";
import { useAmenityCatalog } from "@/hooks/queries/useAmenityCatalog";
import { LocationPicker } from "@/components/molecules/LocationPicker";
import type { PropertyStatus, PropertyType } from "@/lib/types/property";

const STATUSES: PropertyStatus[] = ["draft", "available", "reserved", "sold", "rented", "off_market"];
const TYPES: PropertyType[] = [
  "apartment", "villa", "townhouse", "penthouse",
  "office", "retail", "warehouse", "plot", "building", "other",
];
const FURNISHING = ["furnished", "semi_furnished", "unfurnished"];
const COMPLETION = ["ready", "off_plan"];
const VIEWS = ["sea", "marina", "canal", "lake", "creek", "city", "garden", "pool", "golf", "landmark", "partial", "none"];

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelFor(key: string, value: string): string {
  const MAP: Record<string, Record<string, string>> = {
    status: Object.fromEntries(STATUSES.map((s) => [s, s.replace("_", " ")])),
    property_type: Object.fromEntries(TYPES.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)])),
    country: {},
    has_listing: { true: "Has listing", false: "No listing" },
    has_payment_plan: { true: "Payment plan" }, listing_verified: { true: "Verified only" }, has_floor_plan: { true: "Floor plan" },
  };
  return MAP[key]?.[value] ?? labelify(value);
}

const BASE_FILTER_KEYS = [
  "status", "property_type", "country", "city", "area",
  "assigned_agent_id", "min_price", "max_price",
  "min_bedrooms", "max_bedrooms", "has_listing",
];
const ADVANCED_FILTER_KEYS = [
  "amenities", "furnishing_status", "completion_status", "view_orientation",
  "min_service_charge_aed_sqft", "max_service_charge_aed_sqft",
  "min_plot_area_sqft", "max_plot_area_sqft", "min_parking_spaces", "has_payment_plan",
  "min_build_year", "max_build_year", "listing_verified", "has_floor_plan",
];
const FILTER_KEYS = [...BASE_FILTER_KEYS, ...ADVANCED_FILTER_KEYS];

export function PropertyFiltersBar(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];
  const { data: catalog } = useAmenityCatalog();

  const get = (key: string): string => searchParams.get(key) ?? "";

  const apply = useCallback((overrides: Record<string, string>): void => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const remove = (key: string): void => apply({ [key]: "" });

  const clearAll = (): void => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => params.delete(k));
    params.delete("q");
    router.push(`?${params.toString()}`);
  };

  // Toggle an amenity key in the CSV param
  const toggleAmenity = (key: string): void => {
    const current = get("amenities").split(",").filter(Boolean);
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    apply({ amenities: next.join(",") });
  };

  const activeFilters = FILTER_KEYS.filter((k) => !!searchParams.get(k));
  const hasAdvancedActive = ADVANCED_FILTER_KEYS.some((k) => !!searchParams.get(k));
  const selectedAmenities = get("amenities").split(",").filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search properties..."
          defaultValue={get("q")}
          onChange={(e) => apply({ q: e.target.value })}
          className="w-56 h-9"
        />

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen((p) => !p)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </Button>

        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            Clear all
          </Button>
        )}
      </div>

      {open && (
        <div className="rounded-md border p-4 bg-card space-y-3">
          {/* Base filters grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Select value={get("status")} onValueChange={(v) => apply({ status: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={get("property_type")} onValueChange={(v) => apply({ property_type: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <LocationPicker
                country={get("country") || null}
                city={get("city") || null}
                area={get("area") || null}
                onChange={({ country: c, city: ci, area: a }) => apply({
                  country: c ?? "",
                  city: ci ?? "",
                  area: a ?? "",
                })}
                required={false}
                showArea={true}
                layout="grid"
              />
            </div>

            <Select value={get("assigned_agent_id")} onValueChange={(v) => apply({ assigned_agent_id: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All agents</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input placeholder="Min price" defaultValue={get("min_price")} onBlur={(e) => apply({ min_price: e.target.value })} className="h-8 text-xs" />
            <Input placeholder="Max price" defaultValue={get("max_price")} onBlur={(e) => apply({ max_price: e.target.value })} className="h-8 text-xs" />
            <Input placeholder="Min beds" type="number" defaultValue={get("min_bedrooms")} onBlur={(e) => apply({ min_bedrooms: e.target.value })} className="h-8 text-xs" />
            <Input placeholder="Max beds" type="number" defaultValue={get("max_bedrooms")} onBlur={(e) => apply({ max_bedrooms: e.target.value })} className="h-8 text-xs" />

            <Select value={get("has_listing")} onValueChange={(v) => apply({ has_listing: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Has listing?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Any</SelectItem>
                <SelectItem value="true">Has listing</SelectItem>
                <SelectItem value="false">No listing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowAdvanced((p) => !p)}
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Advanced {hasAdvancedActive && `(active)`}
          </Button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Select value={get("furnishing_status")} onValueChange={(v) => apply({ furnishing_status: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Furnishing" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any furnishing</SelectItem>{FURNISHING.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={get("completion_status")} onValueChange={(v) => apply({ completion_status: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Completion" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any completion</SelectItem>{COMPLETION.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={get("view_orientation")} onValueChange={(v) => apply({ view_orientation: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="View" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any view</SelectItem>{VIEWS.map((s) => <SelectItem key={s} value={s}>{labelify(s)}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Min service charge" defaultValue={get("min_service_charge_aed_sqft")} onBlur={(e) => apply({ min_service_charge_aed_sqft: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Max service charge" defaultValue={get("max_service_charge_aed_sqft")} onBlur={(e) => apply({ max_service_charge_aed_sqft: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Min plot area (sqft)" type="number" defaultValue={get("min_plot_area_sqft")} onBlur={(e) => apply({ min_plot_area_sqft: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Max plot area (sqft)" type="number" defaultValue={get("max_plot_area_sqft")} onBlur={(e) => apply({ max_plot_area_sqft: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Min parking spaces" type="number" defaultValue={get("min_parking_spaces")} onBlur={(e) => apply({ min_parking_spaces: e.target.value })} className="h-8 text-xs" />
                <Select value={get("has_payment_plan")} onValueChange={(v) => apply({ has_payment_plan: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Payment plan?" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any</SelectItem><SelectItem value="true">Has payment plan</SelectItem></SelectContent>
                </Select>

                <Input placeholder="Min build year" type="number" defaultValue={get("min_build_year")} onBlur={(e) => apply({ min_build_year: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Max build year" type="number" defaultValue={get("max_build_year")} onBlur={(e) => apply({ max_build_year: e.target.value })} className="h-8 text-xs" />
                <Select value={get("listing_verified")} onValueChange={(v) => apply({ listing_verified: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Verified?" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any</SelectItem><SelectItem value="true">Verified only</SelectItem></SelectContent>
                </Select>
                <Select value={get("has_floor_plan")} onValueChange={(v) => apply({ has_floor_plan: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Floor plan?" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any</SelectItem><SelectItem value="true">Has floor plan</SelectItem></SelectContent>
                </Select>
              </div>

              {/* Amenity multi-pill */}
              {catalog && catalog.categories.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Amenities (AND)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.categories.flatMap((cat) =>
                      cat.items.map((item) => {
                        const active = selectedAmenities.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleAmenity(item.key)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((k) => (
            <Badge key={k} variant="secondary" className="gap-1 text-xs">
              {labelFor(k, searchParams.get(k) ?? "")}
              <button type="button" onClick={() => remove(k)} aria-label={`Remove ${k} filter`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
