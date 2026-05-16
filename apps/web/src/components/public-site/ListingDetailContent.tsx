"use client";

import { CalendarDays } from "lucide-react";
import type { PublicListingDetail } from "@/lib/types/public-site";
import { AgentCard } from "./AgentCard";
import { ContactForm } from "./ContactForm";
import { ListingCard } from "./ListingCard";
import { MortgageCalculator } from "@/components/molecules/MortgageCalculator";
import { CheckoutCTAs } from "@/components/molecules/CheckoutCTAs";

interface ListingDetailContentProps {
  listing: PublicListingDetail;
  slug: string;
  amenities: string[];
  floorPlanUrls: string[];
  similarListings: import("@/lib/types/public-site").PublicListingCard[] | undefined;
}

export function ListingDetailContent({
  listing,
  slug,
  amenities,
  floorPlanUrls,
  similarListings,
}: ListingDetailContentProps): React.ReactElement {
  const upcomingOpenHouses = listing.upcoming_open_houses ?? [];

  return (
    <div className="space-y-6">
      {listing.description && (
        <section className="rounded-xl bg-slate-50 p-6">
          <h2 className="mb-3 text-base font-bold text-slate-950">About this property</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{listing.description}</p>
        </section>
      )}

      {listing.purpose === "sale" && (
        <MortgageCalculator price={listing.price} currency={listing.currency} />
      )}

      {amenities.length > 0 && (
        <section className="rounded-xl bg-slate-50 p-6">
          <h2 className="mb-3 text-base font-bold text-slate-950">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <span key={a} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {upcomingOpenHouses.length > 0 && (
        <section className="rounded-xl bg-slate-50 p-6">
          <h2 className="mb-3 text-base font-bold text-slate-950">Open Houses</h2>
          <div className="space-y-2">
            {upcomingOpenHouses.slice(0, 3).map((oh, i) => {
              const s = new Date(oh.starts_at);
              const e = new Date(oh.ends_at);
              const date = s.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              const start = s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
              const end = e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">{date}, {start} – {end}</span>
                  {oh.capacity != null && <span className="ml-auto text-xs text-slate-500">Cap. {oh.capacity}</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {floorPlanUrls.length > 0 && (
        <section className="rounded-xl bg-slate-50 p-6">
          <h2 className="mb-3 text-base font-bold text-slate-950">Floor Plans</h2>
          <div className="grid grid-cols-2 gap-3">
            {floorPlanUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={url} alt={`Floor plan ${i + 1}`} className="w-full object-contain" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Mobile: agent + contact form */}
      <div className="space-y-4 lg:hidden">
        {listing.agent && <AgentCard agent={listing.agent} />}
        {listing.agent?.phone && (
          <CheckoutCTAs agentPhone={listing.agent.phone} agentName={listing.agent.full_name} listingTitle={listing.title} />
        )}
        <ContactForm slug={slug} listingId={listing.id} compact />
      </div>

      {similarListings && similarListings.length > 0 && (
        <section className="pt-4">
          <h2 className="mb-4 text-base font-bold text-slate-950">Similar listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {similarListings.map((s) => (
              <ListingCard key={s.id} listing={s} slug={slug} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
