"use client";

import { type ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OPERATING_COUNTRIES } from "@/lib/constants/operating-countries";
import { cn } from "@/lib/utils/cn";
import type { TenantDetailResponse } from "@/lib/types";

interface TenantSettingsTabProps {
  tenant: TenantDetailResponse;
}

export function TenantSettingsTab({ tenant }: TenantSettingsTabProps): ReactElement {
  const active = new Set(tenant.operating_countries);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operating Countries</CardTitle>
          <CardDescription>
            Countries this tenant operates in (read-only here; tenant can edit via company settings).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.operating_countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">None configured.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {OPERATING_COUNTRIES.filter((c) => active.has(c.code)).map((c) => (
                <span
                  key={c.code}
                  className={cn(
                    "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                    "bg-primary/10 text-primary",
                  )}
                >
                  {c.label} ({c.code})
                </span>
              ))}
              {tenant.operating_countries
                .filter((code) => !OPERATING_COUNTRIES.find((c) => c.code === code))
                .map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {code}
                  </span>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
