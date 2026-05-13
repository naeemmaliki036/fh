"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useAgents } from "@/hooks/queries/useAgents";
import { useLeads } from "@/hooks/queries/useLeads";
import { useProperties } from "@/hooks/queries/useProperties";
import { useDeals } from "@/hooks/queries/useDeals";
import { useListings } from "@/hooks/queries/useListings";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { KpiCard } from "@/components/molecules/KpiCard";
import { Users, Home, Target, Handshake, LayoutList, TrendingUp } from "lucide-react";
import { DashboardActionRequired } from "@/components/organisms/DashboardActionRequired";
import { DashboardRecentActivity } from "@/components/organisms/DashboardRecentActivity";
import { DashboardPipeline } from "@/components/organisms/DashboardPipeline";

export default function DashboardPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const { data: tenant, isLoading: tenantLoading } = useMyTenant();

  const { data: agentsData, isLoading: agentsLoading } = useAgents({ status: "active", limit: 1 });
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 1 });
  const { data: propertiesData, isLoading: propsLoading } = useProperties({ limit: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 1 });
  const { data: totalListingsData, isLoading: totalListingsLoading } = useListings({ limit: 1 });
  const { data: listingsData, isLoading: listingsLoading } = useListings({ status: "active", limit: 1 });

  const firstName = currentUser?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {tenant?.name ?? "Your company"} — here is today&apos;s overview
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Listings"
          sublabel="All time"
          value={totalListingsData?.total}
          isLoading={totalListingsLoading}
          icon={LayoutList}
          iconVariant="info"
        />
        <KpiCard
          label="Active Listings"
          sublabel="Currently live"
          value={listingsData?.total}
          isLoading={listingsLoading}
          icon={Home}
          iconVariant="success"
        />
        <KpiCard
          label="Open Leads"
          sublabel="Awaiting action"
          value={leadsData?.total}
          isLoading={leadsLoading}
          icon={Target}
          iconVariant="warning"
        />
        <KpiCard
          label="Total Properties"
          sublabel="In inventory"
          value={propertiesData?.total}
          isLoading={propsLoading}
          icon={TrendingUp}
          iconVariant="info"
        />
        <KpiCard
          label="Active Agents"
          sublabel="Online now"
          value={agentsData?.total}
          isLoading={agentsLoading}
          icon={Users}
          iconVariant="success"
        />
        <KpiCard
          label="Pending Deals"
          sublabel="In pipeline"
          value={dealsData?.total}
          isLoading={dealsLoading}
          icon={Handshake}
          iconVariant="warning"
        />
      </div>

      {/* 3-column content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardActionRequired />
        <DashboardRecentActivity />
        <DashboardPipeline leadsTotal={leadsData?.total ?? 0} dealsTotal={dealsData?.total ?? 0} />
      </div>

      {/* Company info strip */}
      {!tenantLoading && tenant && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-card">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Company</span>
            <span className="font-semibold text-slate-800">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Status</span>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Currency</span>
            <span className="font-semibold text-slate-800">{tenant.currency}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Timezone</span>
            <span className="font-semibold text-slate-800">{tenant.timezone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Properties</span>
            <span className="font-semibold text-slate-800">{propertiesData?.total ?? "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
