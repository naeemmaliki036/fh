"use client";

import Link from "next/link";
import { Building2, BookmarkX } from "lucide-react";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";
import { useMarketplaceAgencies } from "@/hooks/queries/useMarketplaceAgencies";

export function MarketplaceSidebar(): React.ReactElement {
  const { data } = useMarketplaceAgencies(1, 5);
  const topAgencies = data?.items ?? [];

  return (
    <aside className="flex flex-col gap-4 w-full">
      <div className="rounded-xl bg-slate-900 text-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-amber-400 shrink-0" />
          <p className="font-bold text-sm leading-tight">Get listed on {PORTAL_BRAND_NAME}</p>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Reach thousands of buyers and renters across the UAE. No setup fee.
        </p>
        <Link
          href="https://aqarflow.com/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-amber-400 py-2 text-center text-sm font-black text-slate-900 hover:bg-amber-300 transition"
        >
          Become a partner
        </Link>
      </div>

      {topAgencies.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Top agencies</p>
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
                      className="h-9 w-9 rounded object-contain border border-slate-100 shrink-0"
                    />
                  ) : (
                    <span className="h-9 w-9 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {agency.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{agency.name}</p>
                    <p className="text-xs text-slate-400">{agency.listings_count} listings</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 flex items-center gap-3 opacity-60 select-none">
        <BookmarkX className="h-5 w-5 text-slate-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-slate-600">Save your search</p>
          <p className="text-[10px] text-slate-400">Coming soon</p>
        </div>
      </div>
    </aside>
  );
}
