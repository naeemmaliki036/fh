"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantStatusBadge } from "@/components/atoms/TenantStatusBadge";
import { ApproveTenantDialog } from "@/components/organisms/tenant-lifecycle/ApproveTenantDialog";
import { RejectTenantDialog } from "@/components/organisms/tenant-lifecycle/RejectTenantDialog";
import { SuspendTenantDialog } from "@/components/organisms/tenant-lifecycle/SuspendTenantDialog";
import { ReactivateTenantDialog } from "@/components/organisms/tenant-lifecycle/ReactivateTenantDialog";
import { SendTenantMessageDialog } from "@/components/organisms/SendTenantMessageDialog";
import { useAuth } from "@/contexts/AuthContext";
import type { TenantDetailResponse } from "@/lib/types";

interface TenantDetailHeaderProps {
  tenant: TenantDetailResponse;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onSuspend: (reason: string) => void;
  onReactivate: (reason?: string) => void;
  isPending: boolean;
}

export function TenantDetailHeader({
  tenant,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  isPending,
}: TenantDetailHeaderProps): ReactElement {
  const { currentPlatformUser } = useAuth();
  const canSendMessage =
    currentPlatformUser?.role === "super_admin" ||
    currentPlatformUser?.role === "operations_admin";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
          <TenantStatusBadge status={tenant.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Slug: <span className="font-mono">{tenant.slug}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tenant.status === "pending_approval" && (
          <>
            <ApproveTenantDialog
              trigger={<Button size="sm">Approve</Button>}
              tenantName={tenant.name}
              onConfirm={onApprove}
              isPending={isPending}
            />
            <RejectTenantDialog
              trigger={<Button size="sm" variant="destructive">Reject</Button>}
              tenantName={tenant.name}
              onConfirm={onReject}
              isPending={isPending}
            />
          </>
        )}

        {tenant.status === "active" && (
          <SuspendTenantDialog
            trigger={<Button size="sm" variant="destructive">Suspend</Button>}
            tenantName={tenant.name}
            onConfirm={onSuspend}
            isPending={isPending}
          />
        )}

        {tenant.status === "suspended" && (
          <ReactivateTenantDialog
            trigger={<Button size="sm" variant="outline">Reactivate</Button>}
            tenantName={tenant.name}
            onConfirm={onReactivate}
            isPending={isPending}
          />
        )}

        {canSendMessage && (
          <SendTenantMessageDialog
            tenantId={tenant.id}
            tenantName={tenant.name}
            trigger={
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Send message
              </Button>
            }
          />
        )}

        <Button size="sm" variant="outline" asChild>
          <Link href={`/platform/tenants/${tenant.id}/settings`}>
            <Settings className="h-4 w-4 mr-1.5" />
            Edit settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
