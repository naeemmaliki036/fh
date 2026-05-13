import type { ReactElement } from "react";
import {
  Users,
  UserCheck,
  Building2,
  ListChecks,
  TrendingUp,
  Handshake,
} from "lucide-react";
import { KpiCard } from "@/components/molecules/KpiCard";
import type { TenantCounts } from "@/lib/types";

interface TenantKpiRowProps {
  counts: TenantCounts;
}

export function TenantKpiRow({ counts }: TenantKpiRowProps): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard icon={Users} value={counts.users} label="Users" />
      <KpiCard icon={UserCheck} value={counts.agents} label="Agents" />
      <KpiCard icon={Building2} value={counts.properties} label="Properties" />
      <KpiCard icon={ListChecks} value={counts.listings} label="Listings" />
      <KpiCard icon={TrendingUp} value={counts.leads} label="Leads" />
      <KpiCard icon={Handshake} value={counts.deals} label="Deals" />
    </div>
  );
}
