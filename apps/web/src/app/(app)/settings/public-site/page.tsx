"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicSiteSettings } from "@/hooks/queries/tenant-public-site/usePublicSiteSettings";
import { useUpdatePublicSiteSettings } from "@/hooks/mutations/tenant-public-site/useUpdatePublicSiteSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { PublicSiteUrlPanel } from "@/components/public-site/PublicSiteUrlPanel";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";
import { CustomizeSection } from "./CustomizeSection";

const OWNER_ROLES = new Set(["company_owner", "company_admin"]);

const baseSchema = z.object({
  public_site_enabled: z.boolean(),
  public_site_logo_url: z
    .string()
    .url("Must be a valid URL")
    .refine((u) => u.startsWith("https://"), "Must start with https://")
    .or(z.literal(""))
    .optional(),
  public_site_tagline: z.string().max(200, "Max 200 characters").optional(),
});
type BaseFormValues = z.infer<typeof baseSchema>;

export default function PublicSiteSettingsPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const canEdit = !!(currentUser && OWNER_ROLES.has(currentUser.role));

  const { data: settings, isLoading } = usePublicSiteSettings();
  const { mutate: save, isPending } = useUpdatePublicSiteSettings();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<BaseFormValues>({
      resolver: zodResolver(baseSchema),
      defaultValues: {
        public_site_enabled: false,
        public_site_logo_url: "",
        public_site_tagline: "",
      },
    });

  useEffect(() => {
    if (settings) {
      reset({
        public_site_enabled: settings.public_site_enabled,
        public_site_logo_url: settings.public_site_logo_url ?? "",
        public_site_tagline: settings.public_site_tagline ?? "",
      });
    }
  }, [settings, reset]);

  const enabled = watch("public_site_enabled");

  const onSubmit = (data: BaseFormValues): void => {
    save({
      public_site_enabled: data.public_site_enabled,
      public_site_logo_url: data.public_site_logo_url || null,
      public_site_tagline: data.public_site_tagline || null,
    });
  };

  const publicUrl = settings ? `/p/${settings.slug}` : null;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Public Website</h1>
        {settings?.public_site_enabled && publicUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Open public site
            </a>
          </Button>
        )}
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Website Settings</CardTitle>
          <CardDescription>
            {canEdit
              ? "Configure your public-facing property website."
              : "View-only — contact an owner or admin to make changes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="public_site_enabled">Enable public website</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When enabled, your property listings are publicly accessible.
                </p>
              </div>
              <ToggleSwitch
                id="public_site_enabled"
                checked={enabled}
                onCheckedChange={(v) => setValue("public_site_enabled", v)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company Logo</Label>
              <Controller
                name="public_site_logo_url"
                control={control}
                render={({ field }) => (
                  <ImageUploadField
                    purpose="logo"
                    label="company logo"
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                  />
                )}
              />
              {errors.public_site_logo_url && (
                <p className="text-xs text-destructive">{errors.public_site_logo_url.message}</p>
              )}
              <p className="text-xs text-muted-foreground">PNG or WebP recommended. Max 5 MB.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="Find your dream property in Dubai"
                maxLength={200}
                disabled={!canEdit}
                {...register("public_site_tagline")}
              />
              {errors.public_site_tagline && (
                <p className="text-xs text-destructive">{errors.public_site_tagline.message}</p>
              )}
            </div>
            {canEdit && (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {settings && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Your Public URL</CardTitle>
            <CardDescription>Share this link with prospective buyers and tenants.</CardDescription>
          </CardHeader>
          <CardContent>
            <PublicSiteUrlPanel slug={settings.slug} />
          </CardContent>
        </Card>
      )}

      {canEdit && settings && (
        <CustomizeSection settings={settings} />
      )}
    </div>
  );
}
