"use client";

import { useCallback, useState, type ReactElement } from "react";
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
import type { ListingStatus, ListingPurpose, ListingTier } from "@/lib/types/listing";

const STATUSES: ListingStatus[] = [
  "draft", "pending_review", "changes_requested", "approved",
  "active", "paused", "sold", "rented", "expired", "archived", "off_market",
];
const PURPOSES: ListingPurpose[] = ["sale", "rent_short", "rent_long"];
const TIERS: ListingTier[] = ["standard", "premium", "featured"];
const TYPES = [
  "apartment", "villa", "townhouse", "penthouse",
  "office", "retail", "warehouse", "plot", "building", "other",
];
const FURNISHING = ["furnished", "semi_furnished", "unfurnished"];
const COMPLETION = ["ready", "off_plan"];
const VIEWS = ["sea", "marina", "canal", "lake", "creek", "city", "garden", "pool", "golf", "landmark", "partial", "none"];

const PURPOSE_LABELS: Record<ListingPurpose, string> = {
  sale: "For Sale",
  rent_short: "Short-term Rent",
  rent_long: "Long-term Rent",
};

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const BASE_FILTER_KEYS = [
  "status", "purpose", "listing_tier", "assigned_agent_id",
  "min_price", "max_price", "country", "city",
];
const CHEQUE_OPTIONS = ["1","2","4","6","12"] as const;
const ADVANCED_FILTER_KEYS = [
  "property_type", "min_bedrooms", "max_bedrooms", "min_bathrooms", "max_bathrooms",
  "amenities", "furnishing_status", "completion_status", "view_orientation",
  "is_verified", "rent_cheque_count", "min_build_year", "max_build_year", "has_floor_plan",
];
const FILTER_KEYS = [...BASE_FILTER_KEYS, ...ADVANCED_FILTER_KEYS];

function labelFor(key: string, value: string): string {
  if (key === "purpose") return PURPOSE_LABELS[value as ListingPurpose] ?? value;
  if (key === "status") return value.replace("_", " ");
  if (key === "listing_tier") return value.charAt(0).toUpperCase() + value.slice(1);
  return labelify(value);
}

export function ListingFiltersBar(): ReactElement {
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
    [...FILTER_KEYS, "q"].forEach((k) => params.delete(k));
    router.push(`?${params.toString()}`);
  };

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
          placeholder="Search listings..."
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
          {/* Base filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Select value={get("status")} onValueChange={(v) => apply({ status: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={get("purpose")} onValueChange={(v) => apply({ purpose: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Purpose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All purposes</SelectItem>
                {PURPOSES.map((p) => <SelectItem key={p} value={p}>{PURPOSE_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={get("listing_tier")} onValueChange={(v) => apply({ listing_tier: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All tiers</SelectItem>
                {TIERS.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={get("assigned_agent_id")} onValueChange={(v) => apply({ assigned_agent_id: v === "_all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All agents</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input placeholder="Min price" defaultValue={get("min_price")} onBlur={(e) => apply({ min_price: e.target.value })} className="h-8 text-xs" />
            <Input placeholder="Max price" defaultValue={get("max_price")} onBlur={(e) => apply({ max_price: e.target.value })} className="h-8 text-xs" />
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <LocationPicker
                country={get("country") || null}
                city={get("city") || null}
                area={null}
                onChange={({ country: c, city: ci }) => apply({
                  country: c ?? "",
                  city: ci ?? "",
                })}
                required={false}
                showArea={false}
                layout="grid"
              />
            </div>
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
            Advanced {hasAdvancedActive && "(active)"}
          </Button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Select value={get("property_type")} onValueChange={(v) => apply({ property_type: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Property type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All types</SelectItem>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Input placeholder="Min beds" type="number" defaultValue={get("min_bedrooms")} onBlur={(e) => apply({ min_bedrooms: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Max beds" type="number" defaultValue={get("max_bedrooms")} onBlur={(e) => apply({ max_bedrooms: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Min baths" type="number" defaultValue={get("min_bathrooms")} onBlur={(e) => apply({ min_bathrooms: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Max baths" type="number" defaultValue={get("max_bathrooms")} onBlur={(e) => apply({ max_bathrooms: e.target.value })} className="h-8 text-xs" />

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
                <Select value={get("is_verified")} onValueChange={(v) => apply({ is_verified: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Verified?" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any</SelectItem><SelectItem value="true">Verified only</SelectItem></SelectContent>
                </Select>
                <Select value={get("rent_cheque_count")} onValueChange={(v) => apply({ rent_cheque_count: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Cheques" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any</SelectItem>{CHEQUE_OPTIONS.map((n) => <SelectItem key={n} value={n}>{n} {n === "1" ? "cheque" : "cheques"}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Min build year" type="number" defaultValue={get("min_build_year")} onBlur={(e) => apply({ min_build_year: e.target.value })} className="h-8 text-xs" />
                <Input placeholder="Max build year" type="number" defaultValue={get("max_build_year")} onBlur={(e) => apply({ max_build_year: e.target.value })} className="h-8 text-xs" />
                <Select value={get("has_floor_plan")} onValueChange={(v) => apply({ has_floor_plan: v === "_all" ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Floor plan?" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">Any</SelectItem><SelectItem value="true">Has floor plan</SelectItem></SelectContent>
                </Select>
              </div>

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
