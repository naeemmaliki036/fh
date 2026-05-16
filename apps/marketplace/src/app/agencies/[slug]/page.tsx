"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Phone, Mail, Loader2 } from "lucide-react";
import { useMarketplaceAgency } from "@/hooks/queries/useMarketplaceAgency";
import { useMarketplaceAgencyListings } from "@/hooks/queries/useMarketplaceAgencyListings";
import { MarketplaceListingCard } from "@/components/MarketplaceListingCard";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TABS = ["listings", "about", "contact"] as const;
type Tab = (typeof TABS)[number];

export default function AgencyProfilePage({ params }: PageProps): React.ReactElement {
  const { slug } = use(params);
  const [tab, setTab] = useState<Tab>("listings");
  const [page, setPage] = useState(1);

  const { data: agency, isLoading: agencyLoading } = useMarketplaceAgency(slug);
  const { data: listingsData, isLoading: listingsLoading } = useMarketplaceAgencyListings(slug, {
    page,
    page_size: 12,
  });

  const listings = listingsData?.items ?? [];
  const total = listingsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  if (agencyLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center py-20 text-red-500 text-sm">
          Agency not found.
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />
      <main className="flex-1">
        {/* Banner */}
        <div className="relative h-52 md:h-72 bg-gradient-to-br from-teal-600 to-teal-800 overflow-hidden">
          {agency.banner_url && (
            <img
              src={agency.banner_url}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-5 left-5 md:left-8 flex items-end gap-4">
            {agency.logo_url && (
              <img
                src={agency.logo_url}
                alt={agency.name}
                className="h-20 w-20 rounded-2xl border-4 border-white object-contain bg-white shadow-xl"
              />
            )}
            <div className="text-white mb-1">
              <h1 className="text-2xl font-black leading-tight">{agency.name}</h1>
              {agency.tagline && (
                <p className="text-sm text-white/80 mt-0.5">{agency.tagline}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto w-[min(100%-24px,1200px)] py-8 space-y-6">
          <Link
            href="/agencies"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition"
          >
            <ChevronLeft className="h-4 w-4" /> All agencies
          </Link>

          <div className="flex gap-6 text-sm text-slate-500">
            <span>
              <strong className="text-slate-900 font-black">{agency.listings_count}</strong>{" "}
              listings
            </span>
            <span>
              <strong className="text-slate-900 font-black">{agency.agents_count}</strong>{" "}
              agents
            </span>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-100 flex gap-6">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-bold capitalize transition border-b-2 -mb-px ${
                  tab === t
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "listings" && (
            <div className="space-y-5">
              {listingsLoading && (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              )}
              {!listingsLoading && listings.length === 0 && (
                <p className="py-10 text-center text-slate-400">No listings found.</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((l) => (
                  <MarketplaceListingCard key={l.id} listing={l} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:border-teal-400 hover:text-teal-700 transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:border-teal-400 hover:text-teal-700 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "about" && (
            <div className="max-w-xl space-y-2 text-sm text-slate-600">
              <p>{agency.tagline ?? "No description available."}</p>
            </div>
          )}

          {tab === "contact" && (
            <div className="max-w-sm space-y-3">
              {agency.contact_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-teal-500 shrink-0" />
                  <a
                    href={`tel:${agency.contact_phone}`}
                    className="text-teal-600 hover:underline"
                  >
                    {agency.contact_phone}
                  </a>
                </div>
              )}
              {agency.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-teal-500 shrink-0" />
                  <a
                    href={`mailto:${agency.contact_email}`}
                    className="text-teal-600 hover:underline"
                  >
                    {agency.contact_email}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
}
