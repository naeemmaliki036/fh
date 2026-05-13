import { z } from "zod";
import { PUBLIC_SITE_DEFAULTS } from "@/lib/constants/public-site-defaults";

const httpsUrl = z
  .string()
  .refine((v) => v === "" || v.startsWith("https://"), { message: "Must start with https://" })
  .transform((v) => v || null)
  .nullable();

const hexColor = z
  .string()
  .refine((v) => v === "" || /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v), {
    message: "Must be a valid hex color (#RGB or #RRGGBB)",
  })
  .transform((v) => v || null)
  .nullable();

const nullableStr = (maxLen?: number) =>
  z.string().max(maxLen ?? 1000).transform((v) => v || null).nullable();

export const configSchema = z.object({
  hero: z.object({
    headline: nullableStr(200),
    subheadline: nullableStr(500),
    eyebrow: nullableStr(100),
    image_url: httpsUrl,
  }),
  theme: z.object({
    primary_color: hexColor,
    accent_color: hexColor,
  }),
  services: z.object({
    enabled: z.boolean(),
    title: nullableStr(120),
    subtitle: nullableStr(300),
    cards: z.array(
      z.object({
        title: z.string().min(1, "Required").max(80),
        description: z.string().min(1, "Required").max(300),
      }),
    ).length(4, "Exactly 4 service cards required"),
  }),
  team: z.object({
    title: nullableStr(120),
    subtitle: nullableStr(300),
    show_agents: z.boolean(),
    members: z.array(
      z.object({
        name: z.string().min(1, "Required").max(120),
        title: z.string().min(1, "Required").max(120),
        photo_url: httpsUrl,
        phone: nullableStr(40),
        email: nullableStr(200),
        linkedin_url: httpsUrl,
      }),
    ).max(30),
  }),
  footer: z.object({
    description: nullableStr(500),
    address: nullableStr(200),
    instagram_url: httpsUrl,
    facebook_url: httpsUrl,
    linkedin_url: httpsUrl,
  }),
  sections: z.object({
    services_enabled: z.boolean(),
    team_enabled: z.boolean(),
    contact_enabled: z.boolean(),
  }),
  contact: z.object({
    title: nullableStr(80),
    headline: nullableStr(200),
    whatsapp: z
      .string()
      .refine((v) => v === "" || /^\+?\d+$/.test(v.replace(/\s/g, "")), {
        message: "Digits only, optionally prefixed with +",
      })
      .transform((v) => v || null)
      .nullable(),
  }),
});

export type ConfigFormValues = z.infer<typeof configSchema>;

export function buildDefaultConfig(): ConfigFormValues {
  return {
    hero: {
      headline: null,
      subheadline: null,
      eyebrow: null,
      image_url: null,
    },
    theme: {
      primary_color: PUBLIC_SITE_DEFAULTS.theme.primary_color,
      accent_color: PUBLIC_SITE_DEFAULTS.theme.accent_color,
    },
    services: {
      enabled: true,
      title: null,
      subtitle: null,
      cards: (PUBLIC_SITE_DEFAULTS.services.cards ?? []).map((c) => ({ ...c })),
    },
    team: {
      title: null,
      subtitle: null,
      show_agents: true,
      members: [],
    },
    footer: {
      description: null,
      address: null,
      instagram_url: null,
      facebook_url: null,
      linkedin_url: null,
    },
    sections: {
      services_enabled: true,
      team_enabled: true,
      contact_enabled: true,
    },
    contact: {
      title: null,
      headline: null,
      whatsapp: null,
    },
  };
}
