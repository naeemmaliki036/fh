import type { ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format-date";
import type { TenantDetailResponse } from "@/lib/types";

function fmt(value: string | null | undefined): string {
  return formatDate(value, "en") || "—";
}

interface TenantOverviewTabProps {
  tenant: TenantDetailResponse;
}

function InfoRow({ label, value }: { label: string; value: string | null }): ReactElement {
  return (
    <div className="flex justify-between py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function TenantOverviewTab({ tenant }: TenantOverviewTabProps): ReactElement {
  const sub = tenant.subscription_info;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Currency" value={tenant.currency} />
          <InfoRow label="Timezone" value={tenant.timezone} />
          <InfoRow label="Locale" value={tenant.locale} />
          <InfoRow
            label="Operating countries"
            value={tenant.operating_countries.length > 0
              ? tenant.operating_countries.join(", ")
              : null}
          />
          <InfoRow label="Created" value={fmt(tenant.created_at)} />
          <InfoRow label="Approved" value={fmt(tenant.approved_at)} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {sub ? (
              <>
                <InfoRow label="Plan" value={sub.plan} />
                <InfoRow label="Status" value={sub.status} />
                <InfoRow label="Expires" value={fmt(sub.expires_at)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No subscription info available.</p>
            )}
          </CardContent>
        </Card>

        {tenant.status === "suspended" && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">Suspension Details</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Suspended at" value={fmt(tenant.suspended_at)} />
              <InfoRow label="Reason" value={tenant.suspended_reason} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
