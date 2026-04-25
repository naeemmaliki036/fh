"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { useUpdateMyTenant } from "@/hooks/mutations/useTenantMutations";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const OWNER_ROLES = new Set(["company_owner", "company_admin"]);

const schema = z.object({
  name: z.string().min(2),
  currency: z.string().min(3).max(3),
  timezone: z.string().min(1),
  locale: z.string().min(2),
});

type FormValues = z.infer<typeof schema>;

export default function CompanyPage(): React.ReactElement {
  const { data: tenant, isLoading } = useMyTenant();
  const { mutate: update, isPending } = useUpdateMyTenant();
  const { currentUser } = useAuth();

  const canEdit = !!(currentUser && OWNER_ROLES.has(currentUser.role));

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: tenant?.name ?? "",
      currency: tenant?.currency ?? "AED",
      timezone: tenant?.timezone ?? "Asia/Dubai",
      locale: tenant?.locale ?? "en",
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
              <Input id="currency" disabled={!canEdit} maxLength={3} {...register("currency")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" disabled={!canEdit} {...register("timezone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="locale">Locale</Label>
              <Input id="locale" disabled={!canEdit} {...register("locale")} />
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
