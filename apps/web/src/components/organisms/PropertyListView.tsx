"use client";

import Link from "next/link";
import { ExternalLink, Play } from "lucide-react";
import { PropertyTypeBadge } from "@/components/atoms/PropertyTypeBadge";
import { PropertyStatusBadge } from "@/components/atoms/PropertyStatusBadge";
import { Button } from "@/components/ui/button";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { listingHandle } from "@/lib/utils/listing-url";
import type { Property, PropertyStatus } from "@/lib/types/property";

type TransitionDef = { label: string; status: PropertyStatus; destructive: boolean };

function PropertyThumb({ url, kind }: { url?: string | null; kind?: string | null }): React.ReactElement {
  if (url && kind === "image") {
    return (
      <img
        src={url}
        className="h-10 w-14 rounded object-cover flex-shrink-0"
        alt=""
        loading="lazy"
      />
    );
  }
  if (url && kind === "video") {
    return (
      <div className="relative h-10 w-14 rounded bg-black flex-shrink-0 flex items-center justify-center">
        <Play className="h-4 w-4 text-white" />
      </div>
    );
  }
  return <div className="h-10 w-14 rounded bg-muted flex-shrink-0" />;
}

export function getPropertyTransitions(p: Property): TransitionDef[] {
  switch (p.status) {
    case "available":
      return [{ label: "Mark off-market", status: "off_market", destructive: true }];
    case "off_market":
      return [{ label: "Mark available", status: "available", destructive: false }];
    case "draft":
      return [{ label: "Mark available", status: "available", destructive: false }];
    case "reserved":
      return [{ label: "Mark off-market", status: "off_market", destructive: true }];
    default:
      return [];
  }
}

interface PropertyListViewProps {
  items: Property[];
  onStatusChange: (property: Property, targetStatus: PropertyStatus) => void;
}

export function PropertyListView({ items, onStatusChange }: PropertyListViewProps): React.ReactElement {
  const { data: tenant } = useMyTenant();

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-3 text-left font-medium w-12" />
            <th className="px-3 py-3 text-left font-medium">Title</th>
            <th className="px-3 py-3 text-left font-medium">Type</th>
            <th className="px-3 py-3 text-left font-medium">Beds/Baths</th>
            <th className="px-3 py-3 text-left font-medium">Size</th>
            <th className="px-3 py-3 text-left font-medium">Price</th>
            <th className="px-3 py-3 text-left font-medium">Status</th>
            <th className="px-3 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const transitions = getPropertyTransitions(p);
            const websiteUrl =
              p.first_active_listing_id && tenant?.slug
                ? `/p/${tenant.slug}/listings/${listingHandle(p.first_active_listing_title ?? null, p.first_active_listing_id)}`
                : null;
            return (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2.5">
                  <PropertyThumb url={p.thumbnail_url} kind={p.thumbnail_kind} />
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-medium line-clamp-1">{p.title}</p>
                  {p.city && (
                    <p className="text-xs text-muted-foreground">
                      {p.city}{p.area ? `, ${p.area}` : ""}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <PropertyTypeBadge type={p.property_type} />
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {p.bedrooms != null ? `${p.bedrooms}bd` : "—"}
                  {p.bathrooms != null ? ` / ${p.bathrooms}ba` : ""}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {p.size_sqft ? `${p.size_sqft} sqft` : "—"}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {p.price ? `${p.currency ?? ""} ${p.price}` : "—"}
                </td>
                <td className="px-3 py-2.5">
                  <PropertyStatusBadge status={p.status} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/properties/${p.id}`}>View</Link>
                    </Button>
                    {websiteUrl && (
                      <Button size="sm" variant="outline" asChild aria-label="View on website">
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {transitions.map((t) => (
                      <Button
                        key={t.status}
                        size="sm"
                        variant={t.destructive ? "destructive" : "secondary"}
                        onClick={() => onStatusChange(p, t.status)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
