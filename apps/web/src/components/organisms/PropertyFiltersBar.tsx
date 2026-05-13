"use client";

import { useState, useCallback, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/hooks/queries/useAgents";
import { CITIES_BY_COUNTRY, AREAS_BY_CITY } from "@/lib/constants/locations";
import type { PropertyStatus, PropertyType } from "@/lib/types/property";

const STATUSES: PropertyStatus[] = ["draft", "available", "reserved", "sold", "rented", "off_market"];
const TYPES: PropertyType[] = [
  "apartment", "villa", "townhouse", "penthouse",
  "office", "retail", "warehouse", "plot", "building", "other",
];
const COUNTRIES = [
  { value: "AE", label: "UAE" },
  { value: "SA", label: "Saudi Arabia" },
];

function labelFor(key: string, value: string): string {
  const MAP: Record<string, Record<string, string>> = {
    status: Object.fromEntries(STATUSES.map((s) => [s, s.replace("_", " ")])),
    property_type: Object.fromEntries(TYPES.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)])),
    country: { AE: "UAE", SA: "Saudi Arabia" },
    has_listing: { true: "Has listing", false: "No listing" },
  };
  return MAP[key]?.[value] ?? value;
}

const FILTER_KEYS = [
  "status", "property_type", "country", "city", "area",
  "assigned_agent_id", "min_price", "max_price",
  "min_bedrooms", "max_bedrooms", "has_listing",
];

export function PropertyFiltersBar(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];

  const get = (key: string): string => searchParams.get(key) ?? "";

  const country = get("country");
  const city = get("city");
  const cityOptions = country ? (CITIES_BY_COUNTRY[country] ?? []) : [];
  const areaOptions = city ? (AREAS_BY_CITY[city] ?? []) : [];

  const apply = useCallback((overrides: Record<string, string>): void => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
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

  const activeFilters = FILTER_KEYS.filter((k) => !!searchParams.get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search properties..."
          defaultValue={get("q")}
          onChange={(e) => apply({ q: e.target.value })}
          className="w-56 h-9"
        />

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen((p) => !p)}
        >
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
        <div className="rounded-md border p-4 bg-card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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

          <Select value={get("country")} onValueChange={(v) => apply({ country: v === "_all" ? "" : v, city: "", area: "" })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All countries</SelectItem>
              {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={get("city")} onValueChange={(v) => apply({ city: v === "_all" ? "" : v, area: "" })} disabled={!country}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All cities</SelectItem>
              {cityOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {areaOptions.length > 0 && (
            <Select value={get("area")} onValueChange={(v) => apply({ area: v === "_all" ? "" : v })} disabled={!city}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Area" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All areas</SelectItem>
                {areaOptions.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={get("assigned_agent_id")} onValueChange={(v) => apply({ assigned_agent_id: v === "_all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All agents</SelectItem>
              {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input
            placeholder="Min price"
            defaultValue={get("min_price")}
            onBlur={(e) => apply({ min_price: e.target.value })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Max price"
            defaultValue={get("max_price")}
            onBlur={(e) => apply({ max_price: e.target.value })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Min beds"
            type="number"
            defaultValue={get("min_bedrooms")}
            onBlur={(e) => apply({ min_bedrooms: e.target.value })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Max beds"
            type="number"
            defaultValue={get("max_bedrooms")}
            onBlur={(e) => apply({ max_bedrooms: e.target.value })}
            className="h-8 text-xs"
          />

          <Select value={get("has_listing")} onValueChange={(v) => apply({ has_listing: v === "_all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Has listing?" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Any</SelectItem>
              <SelectItem value="true">Has listing</SelectItem>
              <SelectItem value="false">No listing</SelectItem>
            </SelectContent>
          </Select>
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
