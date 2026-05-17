/**
 * Country metadata helpers.
 *
 * The canonical source of name + flag is `GET /marketplace/countries`
 * (admin-managed via the platform-admin UI). Use `lookupCountry()` when
 * you have the API list available, and fall back to `getCountryMeta()`
 * for the rare case where you don't (e.g. SSR before the query resolves).
 */

import type { MarketplaceCountryItem } from "@fh/portal-types";

/** Map ISO-2 → ISO-3 alpha codes for the GCC + common region countries. */
export const ISO2_TO_ISO3: Record<string, string> = {
  AE: "ARE",
  SA: "SAU",
  QA: "QAT",
  BH: "BHR",
  KW: "KWT",
  OM: "OMN",
  JO: "JOR",
  EG: "EGY",
  LB: "LBN",
  IQ: "IRQ",
};

/** Return the ISO-3 code for a country, falling back to the ISO-2 if unmapped. */
export function toIso3(code: string): string {
  return ISO2_TO_ISO3[code] ?? code;
}

export interface CountryMeta {
  name: string;
  flag: string;
}

const FALLBACK: Record<string, CountryMeta> = {
  AE: { name: "United Arab Emirates", flag: "🇦🇪" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦" },
  QA: { name: "Qatar", flag: "🇶🇦" },
  BH: { name: "Bahrain", flag: "🇧🇭" },
  KW: { name: "Kuwait", flag: "🇰🇼" },
};

export function getCountryMeta(code: string): CountryMeta {
  return FALLBACK[code] ?? { name: code, flag: "🌐" };
}

/**
 * Resolve a country's display name + flag from the live API list when
 * available, with a static fallback for the (rare) loading-state.
 */
export function lookupCountry(
  code: string | null | undefined,
  apiList: MarketplaceCountryItem[] | undefined,
): CountryMeta {
  if (!code) return { name: "", flag: "🌐" };
  const hit = apiList?.find((c) => c.code === code);
  if (hit) return { name: hit.name, flag: hit.flag_emoji };
  return getCountryMeta(code);
}
