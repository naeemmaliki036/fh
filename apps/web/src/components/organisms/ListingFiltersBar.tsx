"use client";

import { useCallback, useState, type ReactElement } from "react";
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
import type { ListingStatus, ListingPurpose, ListingTier } from "@/lib/types/listing";

const STATUSES: ListingStatus[] = [
  "draft", "pending_review", "changes_requested", "approved",
  "active", "paused", "sold", "rented", "expired", "archived", "off_market",
];
const PURPOSES: ListingPurpose[] = ["sale", "rent_short", "rent_long"];
const TIERS: ListingTier[] = ["standard", "premium", "featured"];

const PURPOSE_LABELS: Record<ListingPurpose, string> = {
  sale: "For Sale",
  rent_short: "Short-term Rent",
  rent_long: "Long-term Rent",
};

const FILTER_KEYS = [
  "status", "purpose", "listing_tier", "assigned_agent_id",
  "min_price", "max_price", "country", "city",
];

function labelFor(key: string, value: string): string {
  if (key === "purpose") return PURPOSE_LABELS[value as ListingPurpose] ?? value;
  if (key === "status") return value.replace("_", " ");
  if (key === "listing_tier") return value.charAt(0).toUpperCase() + value.slice(1);
  return value;
}

export function ListingFiltersBar(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: agentsData } = useAgents();
  const agents = agentsData?.items ?? [];

  const get = (key: string): string => searchParams.get(key) ?? "";

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
    [...FILTER_KEYS, "q"].forEach((k) => params.delete(k));
    router.push(`?${params.toString()}`);
  };

  const activeFilters = FILTER_KEYS.filter((k) => !!searchParams.get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search listings..."
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
            placeholder="Country (AE/SA)"
            defaultValue={get("country")}
            onBlur={(e) => apply({ country: e.target.value })}
            className="h-8 text-xs"
          />
          <Input
            placeholder="City"
            defaultValue={get("city")}
            onBlur={(e) => apply({ city: e.target.value })}
            className="h-8 text-xs"
          />
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
