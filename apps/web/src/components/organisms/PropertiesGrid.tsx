"use client";

import { useState } from "react";
import Link from "next/link";
import { useProperties } from "@/hooks/queries/useProperties";
import { PropertyTypeBadge } from "@/components/atoms/PropertyTypeBadge";
import { PropertyStatusBadge } from "@/components/atoms/PropertyStatusBadge";
import { PropertyCreateDialog } from "@/components/organisms/PropertyCreateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PropertyStatus, PropertyType } from "@/lib/types/property";

const STATUSES: PropertyStatus[] = ["draft","available","reserved","sold","rented","off_market"];
const TYPES: PropertyType[] = ["apartment","villa","townhouse","penthouse","office","retail","warehouse","plot","building","other"];

export function PropertiesGrid(): React.ReactElement {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PropertyStatus | "all">("all");
  const [type, setType] = useState<PropertyType | "all">("all");
  const [showCreate, setShowCreate] = useState(false);

  const params = {
    q: search || undefined,
    status: status === "all" ? undefined : status,
    property_type: type === "all" ? undefined : type,
  };

  const { data, isLoading, error } = useProperties(params);
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} className="w-60" />
        <Select value={status} onValueChange={v => setStatus(v as PropertyStatus | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={v => setType(v as PropertyType | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{data?.total ?? 0} properties</span>
        <Button onClick={() => setShowCreate(true)}>+ New Property</Button>
      </div>

      {error && <p className="text-sm text-destructive">Failed to load properties.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(p => (
          <Link key={p.id} href={`/properties/${p.id}`}
            className="block rounded-xl border bg-card hover:shadow-md transition-shadow p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm line-clamp-2 flex-1">{p.title}</span>
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
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{p.media_count} media</span>
              <span>{p.listing_count} listings</span>
              <span>{p.assigned_agents.length} agents</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && items.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">No properties found</p>
      )}

      <PropertyCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
