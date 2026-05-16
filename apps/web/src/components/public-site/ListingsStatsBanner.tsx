"use client";

import { useListingStats } from "@/hooks/queries/public-site/useListingStats";

interface ListingsStatsBannerProps {
  slug: string;
  onTypeFilter: (propertyType: string) => void;
}

function labelify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ListingsStatsBanner({
  slug,
  onTypeFilter,
}: ListingsStatsBannerProps): React.ReactElement | null {
  const { data } = useListingStats(slug);
  if (!data) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <span className="font-semibold text-slate-900">
        {data.total} {data.total === 1 ? "property" : "properties"} found
      </span>
      {data.by_type.map(({ property_type, count }) => (
        <button
          key={property_type}
          type="button"
          onClick={() => onTypeFilter(property_type)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white"
        >
          {labelify(property_type)}
          <span className="font-bold text-slate-900">{count}</span>
        </button>
      ))}
    </div>
  );
}
