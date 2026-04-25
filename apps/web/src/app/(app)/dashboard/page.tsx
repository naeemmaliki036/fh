"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/atoms/StatusBadge";

export default function DashboardPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const { data: tenant, isLoading } = useMyTenant();

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
