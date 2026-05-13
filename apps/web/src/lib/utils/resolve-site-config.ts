import type { RawSiteConfig, ResolvedSiteConfig } from "@/lib/types/public-site";
import { PUBLIC_SITE_DEFAULTS } from "@/lib/constants/public-site-defaults";

export function resolveConfig(raw: RawSiteConfig | null | undefined): ResolvedSiteConfig {
  const d = PUBLIC_SITE_DEFAULTS;
  return {
    hero: { ...d.hero, ...(raw?.hero ?? {}) },
    theme: { ...d.theme, ...(raw?.theme ?? {}) },
    services: {
      ...d.services,
      ...(raw?.services ?? {}),
      cards: raw?.services?.cards ?? d.services.cards,
    },
    team: {
      ...d.team,
      ...(raw?.team ?? {}),
      members: raw?.team?.members ?? d.team.members,
    },
    footer: { ...d.footer, ...(raw?.footer ?? {}) },
    sections: { ...d.sections, ...(raw?.sections ?? {}) },
    contact: { ...d.contact, ...(raw?.contact ?? {}) },
  };
}
