"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { useMarketplaceAgency } from "@/hooks/queries/marketplace/useMarketplaceAgency";
import { useMarketplaceAgencyListings } from "@/hooks/queries/marketplace/useMarketplaceAgencyListings";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TABS = ["listings", "about", "contact"] as const;
type Tab = (typeof TABS)[number];

export default function MarketplaceAgencyProfilePage({ params }: PageProps): React.ReactElement {
  const { slug } = use(params);
  const [tab, setTab] = useState<Tab>("listings");
  const [page, setPage] = useState(1);

  const { data: agency, isLoading: agencyLoading } = useMarketplaceAgency(slug);
  const { data: listingsData, isLoading: listingsLoading } = useMarketplaceAgencyListings(slug, {
    page,
    page_size: 10,
  });

  const listings = listingsData?.items ?? [];
  const total = listingsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!agency) {
    return <div className="py-20 text-center text-red-500 text-sm">Agency not found.</div>;
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
        {agency.banner_url && (
          <img src={agency.banner_url} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 md:left-8 flex items-end gap-4">
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
              <p className="text-sm text-slate-200 mt-0.5">{agency.tagline}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-[min(100%-24px,1200px)] py-6 space-y-6">
        {/* Back link */}
        <Link href="/marketplace/agencies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" /> All agencies
        </Link>

        {/* Stats row */}
        <div className="flex gap-6 text-sm text-slate-500">
          <span><strong className="text-slate-900 font-black">{agency.listings_count}</strong> listings</span>
          <span><strong className="text-slate-900 font-black">{agency.agents_count}</strong> agents</span>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 flex gap-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-bold capitalize transition border-b-2 -mb-px ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "listings" && (
          <div className="space-y-4">
            {listingsLoading && (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
              </div>
            )}
            {!listingsLoading && listings.length === 0 && (
              <p className="py-10 text-center text-slate-400">No listings found.</p>
            )}
            {listings.map((l) => (
              <MarketplaceListingCard key={l.id} listing={l} />
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
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
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <a href={`tel:${agency.contact_phone}`} className="text-blue-600 hover:underline">{agency.contact_phone}</a>
              </div>
            )}
            {agency.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <a href={`mailto:${agency.contact_email}`} className="text-blue-600 hover:underline">{agency.contact_email}</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
