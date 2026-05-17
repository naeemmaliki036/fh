"use client";

import Link from "next/link";
import { Home, Heart, Clock, Plus, ArrowRight } from "lucide-react";
import { useConsumerMe } from "@/hooks/queries/useConsumerMe";

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 flex items-center gap-4 shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function MeDashboardPage(): React.ReactElement {
  const { data: me, isLoading } = useConsumerMe();

  const lastLogin = me?.last_login_at
    ? new Date(me.last_login_at).toLocaleDateString("en-AE", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          {isLoading ? "Loading..." : `Welcome, ${me?.full_name ?? me?.email ?? "there"}`}
        </h1>
        {lastLogin && (
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Last login: {lastLogin}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Home className="h-5 w-5" />}
          label="Active listings"
          value={isLoading ? "—" : (me?.listings_count ?? 0)}
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Saved favorites"
          value={isLoading ? "—" : (me?.favorites_count ?? 0)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/me/listings/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
        >
          <Plus className="h-4 w-4" /> Post a property
        </Link>
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-600 transition"
        >
          Browse marketplace <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
