"use client";

import { useState } from "react";
import { type ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { OPERATING_COUNTRIES } from "@/lib/constants/operating-countries";
import { cn } from "@/lib/utils/cn";
import type { TenantDetailResponse } from "@/lib/types";
import { useSetTenantMediaLimits } from "@/hooks/mutations/useTenantLifecycleMutations";

// Floors must match server-side MEDIA_LIMITS_FLOOR
const FLOORS = {
  max_images_per_property: 20,
  max_videos_per_property: 2,
  max_image_mb: 10,
  max_video_mb: 25,
} as const;

interface TenantSettingsTabProps {
  tenant: TenantDetailResponse;
}

export function TenantSettingsTab({ tenant }: TenantSettingsTabProps): ReactElement {
  const active = new Set(tenant.operating_countries);
  const [editOpen, setEditOpen] = useState(false);

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

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Media Limits</CardTitle>
            <CardDescription>
              Per-tenant upload caps. Platform admins can raise these above the floor.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Max images / property</dt>
            <dd className="font-medium">{tenant.max_images_per_property}</dd>
            <dt className="text-muted-foreground">Max videos / property</dt>
            <dd className="font-medium">{tenant.max_videos_per_property}</dd>
            <dt className="text-muted-foreground">Max image size</dt>
            <dd className="font-medium">{tenant.max_image_mb} MB</dd>
            <dt className="text-muted-foreground">Max video size</dt>
            <dd className="font-medium">{tenant.max_video_mb} MB</dd>
          </dl>
        </CardContent>
      </Card>

      <MediaLimitsDialog
        tenantId={tenant.id}
        current={{
          max_images_per_property: tenant.max_images_per_property,
          max_videos_per_property: tenant.max_videos_per_property,
          max_image_mb: tenant.max_image_mb,
          max_video_mb: tenant.max_video_mb,
        }}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media limits edit dialog
// ---------------------------------------------------------------------------

interface MediaLimitsDialogProps {
  tenantId: string;
  current: {
    max_images_per_property: number;
    max_videos_per_property: number;
    max_image_mb: number;
    max_video_mb: number;
  };
  open: boolean;
  onClose: () => void;
}

function MediaLimitsDialog({
  tenantId,
  current,
  open,
  onClose,
}: MediaLimitsDialogProps): ReactElement {
  const { mutate, isPending } = useSetTenantMediaLimits();
  const [values, setValues] = useState(current);

  function set(key: keyof typeof values, raw: string): void {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) setValues((prev) => ({ ...prev, [key]: n }));
  }

  function handleSave(): void {
    mutate({ id: tenantId, body: values }, { onSuccess: onClose });
  }

  const fields: { key: keyof typeof values; label: string; floor: number; unit?: string }[] = [
    { key: "max_images_per_property", label: "Max images per property", floor: FLOORS.max_images_per_property },
    { key: "max_videos_per_property", label: "Max videos per property", floor: FLOORS.max_videos_per_property },
    { key: "max_image_mb", label: "Max image size", floor: FLOORS.max_image_mb, unit: "MB" },
    { key: "max_video_mb", label: "Max video size", floor: FLOORS.max_video_mb, unit: "MB" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit media limits</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map(({ key, label, floor, unit }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}{unit ? ` (${unit})` : ""}</Label>
              <Input
                id={key}
                type="number"
                min={floor}
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Minimum allowed: {floor}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
