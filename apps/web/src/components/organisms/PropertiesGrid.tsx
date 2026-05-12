"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { useProperties } from "@/hooks/queries/useProperties";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useChangePropertyStatus } from "@/hooks/mutations/usePropertyMutations";
import { PropertyTypeBadge } from "@/components/atoms/PropertyTypeBadge";
import { PropertyStatusBadge } from "@/components/atoms/PropertyStatusBadge";
import { PropertyCreateDialog } from "@/components/organisms/PropertyCreateDialog";
import { PropertyListView, getPropertyTransitions } from "@/components/organisms/PropertyListView";
import { StatusChangeDialog } from "@/components/molecules/StatusChangeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { PROPERTY_OFF_MARKET_REASONS, PROPERTY_AVAILABLE_REASONS } from "@/lib/constants/status-reasons";
import type { PropertyStatus, PropertyType, Property } from "@/lib/types/property";
import type { PropertiesViewMode } from "@/lib/types/tenant";

const STORAGE_KEY = "properties_view_mode";
const STATUSES: PropertyStatus[] = ["draft", "available", "reserved", "sold", "rented", "off_market"];
const TYPES: PropertyType[] = ["apartment", "villa", "townhouse", "penthouse", "office", "retail", "warehouse", "plot", "building", "other"];

type PendingTransition = { property: Property; targetStatus: PropertyStatus };

export function PropertiesGrid(): React.ReactElement {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PropertyStatus | "all">("all");
  const [type, setType] = useState<PropertyType | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const [viewMode, setViewMode] = useState<PropertiesViewMode | null>(null);

  const { data: tenant } = useMyTenant();
  const params = {
    q: search || undefined,
    status: status === "all" ? undefined : status,
    property_type: type === "all" ? undefined : type,
  };
  const { data, isLoading, error } = useProperties(params);
  const { mutateAsync: changeStatus } = useChangePropertyStatus();
  const items = data?.items ?? [];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PropertiesViewMode | null;
    if (stored === "card" || stored === "list") {
      setViewMode(stored);
    } else {
      setViewMode(tenant?.default_properties_view ?? "card");
    }
  }, [tenant?.default_properties_view]);

  const activeView = viewMode ?? "card";

  const handleViewChange = (mode: PropertiesViewMode): void => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-60" />
        <Select value={status} onValueChange={(v) => setStatus(v as PropertyStatus | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as PropertyType | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{data?.total ?? 0} properties</span>

        <div className="flex items-center rounded-md border">
          <button
            type="button"
            aria-label="Card view"
            onClick={() => handleViewChange("card")}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-l-md transition-colors",
              activeView === "card" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => handleViewChange("list")}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-r-md transition-colors",
              activeView === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <Button onClick={() => setShowCreate(true)}>+ New Property</Button>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load properties.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && activeView === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const transitions = getPropertyTransitions(p);
            return (
              <div key={p.id} className="block rounded-xl border bg-card hover:shadow-md transition-shadow p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/properties/${p.id}`} className="font-medium text-sm line-clamp-2 flex-1 hover:underline">
                    {p.title}
                  </Link>
                  <PropertyStatusBadge status={p.status} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <PropertyTypeBadge type={p.property_type} />
                  {p.city && <span className="text-xs text-muted-foreground">{p.city}{p.area ? `, ${p.area}` : ""}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.bedrooms != null ? `${p.bedrooms} bed` : ""}{p.bathrooms != null ? ` · ${p.bathrooms} bath` : ""}</span>
                  <span>{p.price ? `${p.currency ?? ""} ${p.price}` : ""}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{p.media_count} media</span>
                    <span>{p.listing_count} listings</span>
                  </div>
                  {transitions.length > 0 && (
                    <div className="flex gap-1">
                      {transitions.map((t) => (
                        <Button
                          key={t.status}
                          size="sm"
                          variant={t.destructive ? "destructive" : "secondary"}
                          className="text-xs h-6 px-2"
                          onClick={() => setPending({ property: p, targetStatus: t.status })}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && activeView === "list" && (
        <PropertyListView
          items={items}
          onStatusChange={(p, targetStatus) => setPending({ property: p, targetStatus })}
        />
      )}

      {!isLoading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">No properties found</p>
      )}

      <PropertyCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />

      {pending && (
        <StatusChangeDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null); }}
          title={`${pending.targetStatus === "off_market" ? "Mark off-market" : "Mark available"}: ${pending.property.title}?`}
          description={
            pending.targetStatus === "off_market"
              ? "This property will be marked as off-market."
              : "This property will be marked as available."
          }
          reasonOptions={
            pending.targetStatus === "off_market"
              ? PROPERTY_OFF_MARKET_REASONS
              : PROPERTY_AVAILABLE_REASONS
          }
          destructive={pending.targetStatus === "off_market"}
          onConfirm={async (reason_code, reason_note) => {
            await changeStatus({
              id: pending.property.id,
              status: pending.targetStatus,
              reason_code,
              reason_note,
            });
          }}
        />
      )}
    </div>
  );
}
