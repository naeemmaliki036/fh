"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminTenantDetail } from "@/hooks/queries/useTenantAdmin";
import {
  useApproveTenantAdmin,
  useRejectTenant,
  useSuspendTenantAdmin,
  useReactivateTenant,
} from "@/hooks/mutations/useTenantLifecycleMutations";
import { TenantDetailHeader } from "@/components/organisms/TenantDetailHeader";
import { TenantKpiRow } from "@/components/organisms/TenantKpiRow";
import { TenantOverviewTab } from "@/components/organisms/TenantOverviewTab";
import { TenantActivityTab } from "@/components/organisms/TenantActivityTab";
import { TenantSettingsTab } from "@/components/organisms/TenantSettingsTab";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TenantDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: tenant, isLoading, error } = useAdminTenantDetail(id);
  const { mutate: approve, isPending: approvePending } = useApproveTenantAdmin();
  const { mutate: reject, isPending: rejectPending } = useRejectTenant();
  const { mutate: suspend, isPending: suspendPending } = useSuspendTenantAdmin();
  const { mutate: reactivate, isPending: reactivatePending } = useReactivateTenant();

  const anyPending = approvePending || rejectPending || suspendPending || reactivatePending;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tenant...</p>;
  }
  if (error || !tenant) {
    return <p className="text-sm text-destructive">Failed to load tenant details.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/tenants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to tenants
      </Link>

      <TenantDetailHeader
        tenant={tenant}
        onApprove={() => approve(id)}
        onReject={(reason) => reject({ id, body: { reason_note: reason } })}
        onSuspend={(reason) => suspend({ id, body: { reason_note: reason } })}
        onReactivate={(reason) => reactivate({ id, body: reason ? { reason_note: reason } : undefined })}
        isPending={anyPending}
      />

      <TenantKpiRow counts={tenant.counts} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <TenantOverviewTab tenant={tenant} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <TenantActivityTab activities={tenant.recent_activity} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <TenantSettingsTab tenant={tenant} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
