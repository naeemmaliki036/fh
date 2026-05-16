"use client";

import { useMarketplaceStats } from "@/hooks/queries/useMarketplaceStats";

interface AqarFlowPromoBlockProps {
  portalUrl: string;
  marketingUrl: string;
  brandName: string;
  portalBrandName: string;
}

export function AqarFlowPromoBlock({
  portalUrl,
  marketingUrl,
  brandName,
  portalBrandName,
}: AqarFlowPromoBlockProps): React.ReactElement {
  const { data: stats } = useMarketplaceStats();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto w-[min(100%-32px,1280px)] py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left — CTA */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600">
              Real estate agency?
            </p>
            <h2 className="text-xl font-black text-slate-900 leading-snug">
              List your inventory on {portalBrandName} with {brandName}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              {brandName} is the operations platform built for UAE agencies — manage
              inventory, leads, and deals, then publish to {portalBrandName} in one click.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
              >
                Open {brandName} &rarr;
              </a>
              <a
                href={marketingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-slate-500 hover:text-teal-600 transition"
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Right — Social proof */}
          <div className="flex flex-wrap gap-6 justify-start md:justify-end">
            {stats != null && (
              <StatBadge
                value={stats.total_listings.toLocaleString()}
                label="verified listings"
              />
            )}
            {stats != null && (
              <StatBadge
                value={stats.total_agencies.toLocaleString()}
                label="agencies"
              />
            )}
            <StatBadge value="UAE-wide" label="reach" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  value,
  label,
}: {
  value: string;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center md:items-end gap-0.5">
      <span className="text-2xl font-black text-slate-900">{value}</span>
      <span className="text-xs text-slate-500 font-semibold">{label}</span>
    </div>
  );
}
