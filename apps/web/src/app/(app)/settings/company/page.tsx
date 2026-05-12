"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useUpdateMyTenant } from "@/hooks/mutations/useTenantMutations";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/constants/regions";

const OWNER_ROLES = new Set(["company_owner", "company_admin"]);
const TIMEZONES = [
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Kuwait",
  "Asia/Muscat",
  "Asia/Karachi",
  "UTC",
];
const LOCALES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];
const VIEW_OPTIONS = [
  { value: "card", label: "Card view" },
  { value: "list", label: "List view" },
];

const schema = z.object({
  name: z.string().min(2),
  currency: z.string().min(3).max(3),
  timezone: z.string().min(1),
  locale: z.string().min(2),
  default_properties_view: z.enum(["card", "list"]),
});

type FormValues = z.infer<typeof schema>;

export default function CompanyPage(): React.ReactElement {
  const { data: tenant, isLoading } = useMyTenant();
  const { mutate: update, isPending } = useUpdateMyTenant();
  const { currentUser } = useAuth();

  const canEdit = !!(currentUser && OWNER_ROLES.has(currentUser.role));

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: tenant?.name ?? "",
      currency: tenant?.currency ?? "AED",
      timezone: tenant?.timezone ?? "Asia/Dubai",
      locale: tenant?.locale ?? "en",
      default_properties_view: tenant?.default_properties_view ?? "card",
    },
  });

  const onSubmit = (data: FormValues): void => {
    update(data);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Company Settings</h1>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            {canEdit ? "Edit your company information" : "View-only — contact an admin to change"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" disabled={!canEdit} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                    <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                    <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locale">Locale</Label>
              <Controller
                name="locale"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                    <SelectTrigger id="locale"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOCALES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="default_properties_view">Default properties view</Label>
              <Controller
                name="default_properties_view"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                    <SelectTrigger id="default_properties_view"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIEW_OPTIONS.map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {canEdit && (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
