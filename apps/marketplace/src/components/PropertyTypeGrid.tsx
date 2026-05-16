"use client";

import Link from "next/link";
import {
  Building2,
  Home,
  Castle,
  MapPin,
  Briefcase,
  Store,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TypeCardDef {
  type: string;
  label: string;
  Icon: LucideIcon;
}

const TYPE_CARDS: TypeCardDef[] = [
  { type: "apartment", label: "Apartment", Icon: Building2 },
  { type: "villa", label: "Villa", Icon: Home },
  { type: "townhouse", label: "Townhouse", Icon: Home },
  { type: "penthouse", label: "Penthouse", Icon: Castle },
  { type: "land", label: "Plot / Land", Icon: MapPin },
  { type: "office", label: "Office", Icon: Briefcase },
  { type: "retail", label: "Retail", Icon: Store },
  { type: "warehouse", label: "Warehouse", Icon: Warehouse },
];

interface PropertyTypeGridProps {
  byType: Array<{ property_type: string; count: number }>;
  country: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PropertyTypeGrid({
  byType,
  country,
}: PropertyTypeGridProps): React.ReactElement {
  function getCount(type: string): number {
    return byType.find((b) => b.property_type === type)?.count ?? 0;
  }

  return (
    <section>
      <h2 className="text-xl font-black text-slate-900 mb-5">Browse by type</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {TYPE_CARDS.map(({ type, label, Icon }) => {
          const count = getCount(type);
          const href = `/listings?property_type=${type}${country ? `&country=${country}` : ""}`;
          return (
            <Link
              key={type}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center hover:border-teal-300 hover:shadow-md transition group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 group-hover:bg-teal-100 transition">
                <Icon className="h-5 w-5 text-teal-600" />
              </span>
              <span className="text-xs font-bold text-slate-700 leading-tight">
                {label}
              </span>
              {count > 0 && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {count.toLocaleString()}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
