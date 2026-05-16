import type { PublicListingDetail } from "@/lib/types/public-site";

interface ListingJsonLdProps {
  listing: PublicListingDetail;
  slug: string;
  handle: string;
}

/** Renders a JSON-LD RealEstateListing block — no visible output. */
export function ListingJsonLd({
  listing,
  slug,
  handle,
}: ListingJsonLdProps): React.ReactElement {
  const images = [
    ...(listing.hero_media_url ? [listing.hero_media_url] : []),
    ...listing.media_urls,
  ].filter(Boolean);

  const address = [listing.area, listing.city].filter(Boolean).join(", ")
    || listing.address
    || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description ?? listing.short_description ?? undefined,
    image: images.length > 0 ? images : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/p/${slug}/listings/${handle}`,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
    },
    address: address
      ? {
          "@type": "PostalAddress",
          addressLocality: listing.city ?? undefined,
          addressRegion: listing.area ?? undefined,
          streetAddress: listing.address ?? undefined,
        }
      : undefined,
    numberOfRooms: listing.beds ?? undefined,
    floorSize:
      listing.area_sqft != null
        ? { "@type": "QuantitativeValue", value: listing.area_sqft, unitCode: "FTK" }
        : undefined,
    datePosted: listing.created_at ?? undefined,
    yearBuilt: listing.build_year ?? undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
