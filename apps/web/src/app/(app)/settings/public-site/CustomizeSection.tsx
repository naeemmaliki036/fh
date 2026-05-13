"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUpdatePublicSiteSettings } from "@/hooks/mutations/tenant-public-site/useUpdatePublicSiteSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroEditor } from "@/components/public-site-admin/HeroEditor";
import { ThemeEditor } from "@/components/public-site-admin/ThemeEditor";
import { ServicesEditor } from "@/components/public-site-admin/ServicesEditor";
import { TeamEditor } from "@/components/public-site-admin/TeamEditor";
import { FooterEditor } from "@/components/public-site-admin/FooterEditor";
import { SectionsEditor } from "@/components/public-site-admin/SectionsEditor";
import { ContactEditor } from "@/components/public-site-admin/ContactEditor";
import { configSchema, buildDefaultConfig, type ConfigFormValues } from "@/components/public-site-admin/types";
import { queryKeys } from "@/hooks/queryKeys";
import type { PublicSiteSettings } from "@/lib/types/public-site";
import { PUBLIC_SITE_DEFAULTS } from "@/lib/constants/public-site-defaults";

interface CustomizeSectionProps {
  settings: PublicSiteSettings;
}

function toFormValues(raw: PublicSiteSettings["config"]): ConfigFormValues {
  const d = PUBLIC_SITE_DEFAULTS;
  return {
    hero: {
      headline: raw?.hero?.headline ?? null,
      subheadline: raw?.hero?.subheadline ?? null,
      eyebrow: raw?.hero?.eyebrow ?? null,
      image_url: raw?.hero?.image_url ?? null,
    },
    theme: {
      primary_color: raw?.theme?.primary_color ?? d.theme.primary_color,
      accent_color: raw?.theme?.accent_color ?? d.theme.accent_color,
    },
    services: {
      enabled: raw?.services?.enabled ?? true,
      title: raw?.services?.title ?? null,
      subtitle: raw?.services?.subtitle ?? null,
      cards: (raw?.services?.cards ?? d.services.cards ?? []).map((c) => ({ ...c, description: (c as { description?: string; text?: string }).description ?? (c as { description?: string; text?: string }).text ?? "" })),
    },
    team: {
      title: raw?.team?.title ?? null,
      subtitle: raw?.team?.subtitle ?? null,
      show_agents: raw?.team?.show_agents ?? true,
      members: (raw?.team?.members ?? []).map((m) => ({
        name: m.name ?? "",
        title: m.title ?? "",
        photo_url: m.photo_url ?? null,
        phone: m.phone ?? null,
        email: m.email ?? null,
        linkedin_url: m.linkedin_url ?? null,
      })),
    },
    footer: {
      description: raw?.footer?.description ?? null,
      address: raw?.footer?.address ?? null,
      instagram_url: raw?.footer?.instagram_url ?? null,
      facebook_url: raw?.footer?.facebook_url ?? null,
      linkedin_url: raw?.footer?.linkedin_url ?? null,
    },
    sections: {
      services_enabled: raw?.sections?.services_enabled ?? true,
      team_enabled: raw?.sections?.team_enabled ?? true,
      contact_enabled: raw?.sections?.contact_enabled ?? true,
    },
    contact: {
      title: raw?.contact?.title ?? null,
      headline: raw?.contact?.headline ?? null,
      whatsapp: raw?.contact?.whatsapp ?? null,
    },
  };
}

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "theme", label: "Theme" },
  { id: "services", label: "Services" },
  { id: "team", label: "Team" },
  { id: "footer", label: "Footer" },
  { id: "sections", label: "Sections visibility" },
  { id: "contact", label: "Contact section" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export function CustomizeSection({ settings }: CustomizeSectionProps): React.ReactElement {
  const qc = useQueryClient();
  const { mutate: save, isPending } = useUpdatePublicSiteSettings();

  const { control, handleSubmit, reset } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: buildDefaultConfig(),
  });

  useEffect(() => {
    reset(toFormValues(settings.config));
  }, [settings.config, reset]);

  const onSubmit = (data: ConfigFormValues): void => {
    save(
      { config: data },
      {
        onSuccess: () => {
          toast.success("Website updated");
          qc.invalidateQueries({ queryKey: queryKeys.publicSite.profile(settings.slug) });
        },
      },
    );
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Customize website</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {SECTIONS.map(({ id, label }) => (
            <AccordionSection key={id} label={label}>
              <SectionContent id={id} control={control} />
            </AccordionSection>
          ))}
          <div className="pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save website"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AccordionSection({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <details className="group rounded-lg border">
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium select-none">
        {label}
        <span className="ml-2 text-muted-foreground transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}

function SectionContent({ id, control }: { id: SectionId; control: Parameters<typeof HeroEditor>[0]["control"] }): React.ReactElement {
  if (id === "hero") return <HeroEditor control={control} />;
  if (id === "theme") return <ThemeEditor control={control} />;
  if (id === "services") return <ServicesEditor control={control} />;
  if (id === "team") return <TeamEditor control={control} />;
  if (id === "footer") return <FooterEditor control={control} />;
  if (id === "sections") return <SectionsEditor control={control} />;
  return <ContactEditor control={control} />;
}
