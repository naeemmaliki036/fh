"use client";

import Link from "next/link";
import { Building2, BookmarkX } from "lucide-react";
import {
  PORTAL_BRAND_NAME,
  AQARFLOW_PORTAL_URL,
  AQARFLOW_BRAND_NAME,
} from "@/lib/portal-brand";
import { useMarketplaceAgencies } from "@/hooks/queries/useMarketplaceAgencies";

export function MarketplaceSidebar(): React.ReactElement {
  const { data } = useMarketplaceAgencies(1, 5);
  const topAgencies = data?.items ?? [];

  return (
    <aside className="flex flex-col gap-4 w-full">
      {/* Get listed card */}
      <div className="rounded-2xl bg-teal-600 text-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-white shrink-0" />
          <p className="font-bold text-sm leading-tight">
            Get listed on {PORTAL_BRAND_NAME}
          </p>
        </div>
        <p className="text-xs text-teal-50 leading-relaxed">
          Reach thousands of buyers and renters across the UAE. No setup fee. Powered
          by {AQARFLOW_BRAND_NAME}.
        </p>
        <a
          href={AQARFLOW_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-white py-2.5 text-center text-sm font-black text-teal-700 hover:bg-teal-50 transition"
        >
          Become a partner &rarr;
        </a>
      </div>

      {/* Top agencies */}
      {topAgencies.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Top agencies
          </p>
          <ul className="space-y-2.5">
            {topAgencies.map((agency) => (
              <li key={agency.id}>
                <Link
                  href={`/agencies/${agency.slug}`}
                  className="flex items-center gap-3 hover:opacity-80 transition"
                >
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      className="h-9 w-9 rounded-lg object-contain border border-slate-100 shrink-0"
                    />
                  ) : (
                    <span className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-600 shrink-0">
                      {agency.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {agency.name}
                    </p>
                    <p className="text-xs text-slate-400">{agency.listings_count} listings</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Save search — coming soon */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 flex items-center gap-3 opacity-60 select-none">
        <BookmarkX className="h-5 w-5 text-slate-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-slate-600">Save your search</p>
          <p className="text-[10px] text-slate-400">Coming soon</p>
        </div>
      </div>
    </aside>
  );
}
