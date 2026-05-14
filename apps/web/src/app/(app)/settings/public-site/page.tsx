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
import { PublicSiteUrlPanel } from "@/components/public-site/PublicSiteUrlPanel";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";
import { CustomizeSection } from "./CustomizeSection";

const OWNER_ROLES = new Set(["company_owner", "company_admin"]);

/** The three visibility modes presented to tenants. */
type VisibilityMode = "public" | "direct_only" | "off";

const schema = z.object({
  visibility: z.enum(["public", "direct_only", "off"]),
  public_site_logo_url: z
    .string()
    .url("Must be a valid URL")
    .refine((u) => u.startsWith("https://"), "Must start with https://")
    .or(z.literal(""))
    .optional(),
  public_site_tagline: z.string().max(200, "Max 200 characters").optional(),
});
type FormValues = z.infer<typeof schema>;

function settingsToVisibility(enabled: boolean, directOnly: boolean): VisibilityMode {
  if (!enabled) return "off";
  if (directOnly) return "direct_only";
  return "public";
}

const VISIBILITY_OPTIONS: { value: VisibilityMode; label: string; description: string }[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can browse your listings, profile, and agents.",
  },
  {
    value: "direct_only",
    label: "Direct links only",
    description:
      "Listings are hidden from the index but accessible via a direct shared link.",
  },
  {
    value: "off",
    label: "Off",
    description: "Disable your public website entirely.",
  },
];

export default function PublicSiteSettingsPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const canEdit = !!(currentUser && OWNER_ROLES.has(currentUser.role));

  const { data: settings, isLoading } = usePublicSiteSettings();
  const { mutate: save, isPending } = useUpdatePublicSiteSettings();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: "off", public_site_logo_url: "", public_site_tagline: "" },
  });

  useEffect(() => {
    if (settings) {
      reset({
        visibility: settingsToVisibility(
          settings.public_site_enabled,
          settings.public_site_direct_links_only,
        ),
        public_site_logo_url: settings.public_site_logo_url ?? "",
        public_site_tagline: settings.public_site_tagline ?? "",
      });
    }
  }, [settings, reset]);

  const visibility = watch("visibility");
  const featureEnabled = settings?.public_site_feature_enabled ?? false;

  const onSubmit = (data: FormValues): void => {
    save({
      public_site_enabled: data.visibility !== "off",
      public_site_direct_links_only: data.visibility === "direct_only",
      public_site_logo_url: data.public_site_logo_url || null,
      public_site_tagline: data.public_site_tagline || null,
    });
  };

  const publicUrl = settings && visibility === "public" ? `/p/${settings.slug}` : null;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Public Website</h1>
        {publicUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Open public site
            </a>
          </Button>
        )}
      </div>

      {!featureEnabled && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          The public website feature isn&apos;t enabled for your account. Contact your account
          manager to request access.
        </div>
      )}

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
            <fieldset disabled={!canEdit || !featureEnabled} className="space-y-2">
              <legend className="text-sm font-medium mb-2">Visibility</legend>
              {VISIBILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 rounded-md border p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => setValue("visibility", opt.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              ))}
            </fieldset>

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

      {canEdit && settings && <CustomizeSection settings={settings} />}
    </div>
  );
}
