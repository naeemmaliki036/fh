import Link from "next/link";
import { ArrowRight, BedDouble, Bath, Square, Calendar } from "lucide-react";
import type { PublicListingItem } from "@/lib/types/public-site";
import { formatAed } from "@/lib/utils/format-currency";
import { listingHandle } from "@/lib/utils/listing-url";
import { VerifiedBadge } from "@/components/atoms/VerifiedBadge";
import { PriceDropBadge } from "@/components/atoms/PriceDropBadge";
import { PostedAgo } from "@/components/atoms/PostedAgo";
import { CardContactPills } from "@/components/molecules/CardContactPills";
import { CardAgentStrip } from "@/components/molecules/CardAgentStrip";

interface ListingCardProps {
  listing: PublicListingItem;
  slug: string;
}

function purposeLabel(purpose: string): string {
  if (purpose === "sale") return "For Sale";
  if (purpose === "rent_short") return "Short-term";
  return "For Rent";
}

function formatOpenHousePill(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function TierBadge({ tier }: { tier: string | null | undefined }): React.ReactElement | null {
  if (tier === "premium")
    return (
      <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow">
        Premium
      </span>
    );
  if (tier === "featured")
    return (
      <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-yellow-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900 shadow">
        Featured
      </span>
    );
  return null;
}

export function ListingCard({ listing, slug }: ListingCardProps): React.ReactElement {
  const href = `/p/${slug}/listings/${listingHandle(listing.title, listing.id)}`;
  const hasTierBadge = listing.listing_tier === "premium" || listing.listing_tier === "featured";

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-card"
    >
      {/* Inset media frame */}
      <div className="relative m-3 h-56 overflow-hidden rounded-2xl">
        {listing.primary_photo_url ? (
          <img
            src={listing.primary_photo_url}
            alt={listing.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
        )}

        {/* PriceDrop overlay */}
        {listing.price_drop_pct && listing.price_drop_pct > 0 && !hasTierBadge && (
          <div className="absolute right-3 top-3 z-10">
            <PriceDropBadge pct={listing.price_drop_pct} />
          </div>
        )}

        <TierBadge tier={listing.listing_tier} />

        {/* Posted ago chip — top right when no tier badge */}
        {!hasTierBadge && listing.days_since_posted != null && (
          <div className="absolute right-3 bottom-[72px] z-10">
            <span className="bg-white/95 text-slate-700 text-[11px] px-2 py-1 rounded-full">
              <PostedAgo days={listing.days_since_posted} />
            </span>
          </div>
        )}

        {/* Status + verified pills — top left */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
            {purposeLabel(listing.purpose)}
          </span>
          {listing.is_verified && <VerifiedBadge />}
        </div>

        {/* Open house pill */}
        {listing.next_open_house_at && (
          <div className="absolute left-3 bottom-[72px] z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Calendar className="h-3 w-3" />
              {formatOpenHousePill(listing.next_open_house_at)}
            </span>
          </div>
        )}

        {/* Gradient title overlay — bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-white">
            {listing.title}
          </h3>
          {(listing.area || listing.city || listing.address) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-white/75">
              {[listing.area, listing.city].filter(Boolean).join(", ") || listing.address}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-1">
        {/* Stat strip */}
        <div className="flex items-center gap-3 text-[13px] text-slate-600">
          {listing.beds != null && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">{listing.beds}</span>
              <span className="text-slate-400">bd</span>
            </span>
          )}
          {listing.baths != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">{listing.baths}</span>
              <span className="text-slate-400">ba</span>
            </span>
          )}
          {listing.area_sqft != null && (
            <span className="inline-flex items-center gap-1">
              <Square className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">{listing.area_sqft.toLocaleString()}</span>
              <span className="text-slate-400">sqft</span>
            </span>
          )}
          {listing.build_year != null && (
            <span className="text-slate-400 text-xs">· Built {listing.build_year}</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between border-t border-slate-50 pt-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Price</p>
            <p className="text-[15px] font-bold text-slate-950">{formatAed(listing.price)}</p>
            {listing.price_per_sqft != null && (
              <p className="text-[11px] text-slate-400">AED {listing.price_per_sqft.toLocaleString()} / sqft</p>
            )}
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Contact pills */}
        <CardContactPills
          agentPhone={listing.agent_phone}
          agentName={listing.agent_name ?? ""}
          listingTitle={listing.title}
        />

        {/* Agent strip */}
        <CardAgentStrip
          agentName={listing.agent_name}
          agentPhotoUrl={listing.agent_photo_url}
          agentHasLicense={listing.agent_has_license}
        />
      </div>
    </Link>
  );
}
