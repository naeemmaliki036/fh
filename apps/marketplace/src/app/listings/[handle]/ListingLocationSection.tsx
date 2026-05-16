import { MapPin, ExternalLink } from "lucide-react";
import type { MarketplaceListingDetail } from "@fh/portal-types";
import { getCountryMeta } from "@/lib/country-meta";

interface ListingLocationSectionProps {
  listing: MarketplaceListingDetail;
}

export function ListingLocationSection({
  listing,
}: ListingLocationSectionProps): React.ReactElement | null {
  const parts = [
    listing.area,
    listing.city,
    listing.country_name,
  ].filter(Boolean);

  if (parts.length === 0 && listing.lat == null) return null;

  const hasCoords = listing.lat != null && listing.lng != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${listing.lat},${listing.lng}`
    : null;

  // Derive country flag from country_name or city (best effort)
  const countryCode = listing.country_name
    ? Object.entries({
        "United Arab Emirates": "AE",
        "Saudi Arabia": "SA",
        Qatar: "QA",
        Bahrain: "BH",
        Kuwait: "KW",
        Oman: "OM",
        Egypt: "EG",
        Pakistan: "PK",
        India: "IN",
        "United Kingdom": "GB",
        "United States": "US",
        Türkiye: "TR",
      }).find(([name]) =>
        listing.country_name?.toLowerCase().includes(name.toLowerCase()),
      )?.[1] ?? null
    : null;

  const flag = countryCode ? getCountryMeta(countryCode).flag : null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-black text-slate-900">Location</h2>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="h-4 w-4 text-teal-500 shrink-0" />
        <span>
          {flag && <span className="mr-1">{flag}</span>}
          {parts.join(", ")}
        </span>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-3">
        <p className="text-xs text-slate-400 font-semibold">Map view coming soon</p>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
