export interface CountryMeta {
  name: string;
  flag: string;
}

const KNOWN: Record<string, CountryMeta> = {
  AE: { name: "United Arab Emirates", flag: "🇦🇪" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦" },
  QA: { name: "Qatar", flag: "🇶🇦" },
  BH: { name: "Bahrain", flag: "🇧🇭" },
  KW: { name: "Kuwait", flag: "🇰🇼" },
  OM: { name: "Oman", flag: "🇴🇲" },
  EG: { name: "Egypt", flag: "🇪🇬" },
  PK: { name: "Pakistan", flag: "🇵🇰" },
  IN: { name: "India", flag: "🇮🇳" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  US: { name: "United States", flag: "🇺🇸" },
  TR: { name: "Türkiye", flag: "🇹🇷" },
};

export function getCountryMeta(code: string): CountryMeta {
  return KNOWN[code] ?? { name: code, flag: "🌐" };
}
