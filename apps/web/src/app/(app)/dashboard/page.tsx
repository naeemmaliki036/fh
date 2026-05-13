"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useAgents } from "@/hooks/queries/useAgents";
import { useLeads } from "@/hooks/queries/useLeads";
import { useProperties } from "@/hooks/queries/useProperties";
import { useDeals } from "@/hooks/queries/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Users, Briefcase, Home, Handshake } from "lucide-react";

export default function DashboardPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const { data: tenant, isLoading } = useMyTenant();

  const { data: agentsData } = useAgents({ status: "active", limit: 1 });
  const { data: leadsData } = useLeads({ limit: 1 });
  const { data: propertiesData } = useProperties({ status: "available", limit: 1 });
  const { data: dealsData } = useDeals({ limit: 1 });

  const openLeadsTotal = (leadsData?.total ?? 0);
  const dealsInProgress = (dealsData?.total ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {currentUser?.full_name ?? "..."}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here is an overview of your account
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Users className="h-8 w-8 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{agentsData?.total ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Active agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{openLeadsTotal}</p>
              <p className="text-xs text-muted-foreground">Open leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Home className="h-8 w-8 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{propertiesData?.total ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Properties available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Handshake className="h-8 w-8 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{dealsInProgress}</p>
              <p className="text-xs text-muted-foreground">Deals in progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading company info...</p>
      ) : tenant ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Company Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{tenant.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={tenant.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-medium">{tenant.currency}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Timezone</span>
              <span className="font-medium">{tenant.timezone}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
