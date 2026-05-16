"use client";

import Link from "next/link";
import { MapPin, BedDouble, Bath, Maximize2, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { MarketplaceListingItem } from "@/lib/types/marketplace";

interface MarketplaceListingCardProps {
  listing: MarketplaceListingItem;
}

function formatPrice(price: number, currency: string, purpose: string, rentPeriod: string | null): string {
  const formatted = price.toLocaleString("en-AE");
  const base = `${currency} ${formatted}`;
  if (purpose === "sale") return base;
  if (rentPeriod === "yearly") return `${base} / Yearly`;
  if (rentPeriod === "monthly") return `${base} / Mo`;
  return base;
}

function daysAgoLabel(n: number): string {
  if (n === 0) return "Just now";
  if (n === 1) return "1 day ago";
  if (n < 7) return `${n} days ago`;
  if (n < 30) return `${Math.floor(n / 7)}w ago`;
  return `${Math.floor(n / 30)}mo ago`;
}

export function MarketplaceListingCard({ listing }: MarketplaceListingCardProps): React.ReactElement {
  const {
    id, title, price, currency, purpose, rent_period, listing_tier,
    property_type, beds, baths, area_sqft, city, area, primary_photo_url,
    is_verified, price_per_sqft, rent_cheque_count, days_since_posted,
    agent_name, agent_has_license, tenant,
  } = listing;

  const isPremium = listing_tier === "premium" || listing_tier === "featured";

  return (
    <Link
      href={`/marketplace/listings/${id}`}
      className="group flex gap-0 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-52 md:w-64 shrink-0 bg-slate-100">
        {primary_photo_url ? (
          <img
            src={primary_photo_url}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-300 text-xs">
            No image
          </div>
        )}
        {is_verified && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            Verified
          </span>
        )}
        {isPremium && (
          <span className="absolute top-2 right-2 inline-flex rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
            Premium
          </span>
        )}
        {rent_cheque_count && rent_cheque_count > 1 && (
          <span className="absolute top-2 left-2 rounded bg-blue-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {rent_cheque_count} cheques
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-3.5 gap-2">
        {/* Price + specs row */}
        <div>
          <p className="text-lg font-black text-slate-900 leading-tight">
            {formatPrice(price, currency, purpose, rent_period)}
            {price_per_sqft && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {currency} {price_per_sqft.toLocaleString("en-AE")}/sqft
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="capitalize">{property_type.replace("_", " ")}</span>
            {beds != null && <> &bull; {beds}BD</>}
            {baths != null && <> &bull; {baths}BA</>}
            {area_sqft != null && (
              <> &bull; {area_sqft.toLocaleString("en-AE")} sqft</>
            )}
          </p>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{title}</p>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{[area, city].filter(Boolean).join(", ") || "Location TBC"}</span>
        </div>

        {/* Footer row: agent + agency + CTAs */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-col min-w-0">
            {agent_name && (
              <span className="text-xs font-semibold text-slate-700 truncate">
                {agent_name}
                {agent_has_license && (
                  <span className="ml-1 text-[9px] font-bold text-emerald-600 uppercase">RERA</span>
                )}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{daysAgoLabel(days_since_posted)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {tenant.contact_email && (
              <span
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600",
                  "hover:bg-slate-50 transition cursor-pointer",
                )}
              >
                <Mail className="h-3 w-3" /> Email
              </span>
            )}
            {tenant.contact_phone && (
              <span
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white",
                  "hover:bg-emerald-700 transition cursor-pointer",
                )}
              >
                <Phone className="h-3 w-3" /> Call
              </span>
            )}
            {/* Agency logo — navigates to agency page */}
            {tenant.logo_url && (
              <Link
                href={`/marketplace/agencies/${tenant.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="ml-1 shrink-0"
                aria-label={tenant.name}
              >
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-8 w-8 rounded object-contain border border-slate-100"
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
