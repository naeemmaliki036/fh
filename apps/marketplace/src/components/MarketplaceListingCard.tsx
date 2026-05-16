"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MarketplaceListingItem } from "@fh/portal-types";

interface MarketplaceListingCardProps {
  listing: MarketplaceListingItem;
}

function formatPrice(price: number, currency: string, purpose: string): string {
  const formatted = price.toLocaleString("en-AE");
  const base = `${currency} ${formatted}`;
  if (purpose === "sale") return base;
  return `${base} / yr`;
}

function daysAgoLabel(createdAt: string | null): string {
  if (!createdAt) return "";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const n = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (n <= 0) return "Just now";
  if (n === 1) return "1 day ago";
  if (n < 7) return `${n} days ago`;
  if (n < 30) return `${Math.floor(n / 7)}w ago`;
  return `${Math.floor(n / 30)}mo ago`;
}

export function MarketplaceListingCard({
  listing,
}: MarketplaceListingCardProps): React.ReactElement {
  const {
    id,
    title,
    price,
    currency,
    purpose,
    listing_tier,
    property_type,
    beds,
    baths,
    area_sqft,
    city,
    area,
    primary_photo_url,
    is_verified,
    price_per_sqft,
    agent_name,
    agent_has_license,
    created_at,
    tenant,
  } = listing;

  const isPremium = listing_tier === "premium" || listing_tier === "featured";
  const locationStr = [area, city].filter(Boolean).join(", ") || "Location TBC";

  return (
    <Link
      href={`/listings/${id}`}
      className={cn(
        "group flex flex-col rounded-2xl bg-white shadow-sm border border-slate-100",
        "hover:shadow-md hover:border-teal-200 transition-all overflow-hidden",
      )}
    >
      {/* Image — 3:2 ratio */}
      <div className="relative aspect-[3/2] bg-slate-100 overflow-hidden">
        {primary_photo_url ? (
          <img
            src={primary_photo_url}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300 text-xs select-none">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              Verified
            </span>
          )}
          {isPremium && (
            <span className="inline-flex rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase shadow">
              Premium
            </span>
          )}
        </div>

        {/* Agency logo overlay */}
        {tenant.logo_url && (
          <div className="absolute bottom-2 right-2">
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="h-7 w-7 rounded-md object-contain bg-white border border-slate-100 shadow"
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-4">
        {/* Price */}
        <p className="text-base font-black text-slate-900 leading-tight">
          {formatPrice(price, currency, purpose)}
          {price_per_sqft != null && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              {currency} {price_per_sqft.toLocaleString("en-AE")}/sqft
            </span>
          )}
        </p>

        {/* Specs */}
        <p className="text-xs text-slate-500">
          <span className="capitalize">{property_type.replace(/_/g, " ")}</span>
          {beds != null && <> &middot; {beds} BD</>}
          {baths != null && <> &middot; {baths} BA</>}
          {area_sqft != null && (
            <> &middot; {area_sqft.toLocaleString("en-AE")} sqft</>
          )}
        </p>

        {/* Title */}
        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {title}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3 shrink-0 text-teal-500" />
          <span className="truncate">{locationStr}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1">
          <div className="min-w-0">
            {agent_name ? (
              <p className="text-xs font-semibold text-slate-700 truncate">
                {agent_name}
                {agent_has_license && (
                  <span className="ml-1 text-[9px] font-bold text-teal-600 uppercase">
                    RERA
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-400 truncate">{tenant.name}</p>
            )}
            {created_at && (
              <p className="text-[10px] text-slate-400">{daysAgoLabel(created_at)}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
