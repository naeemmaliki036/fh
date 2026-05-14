import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import { ListingDetailShell } from "@/components/public-site/ListingDetailShell";
import { extractListingId } from "@/lib/utils/listing-url";

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  try {
    const listing = await publicSiteRepository.getListing(slug, extractListingId(id));
    const firstImage = listing.media_urls[0] ?? listing.hero_media_url ?? undefined;
    return {
      title: `${listing.title} — ${listing.tenant_name ?? "Properties"}`,
      description:
        listing.description ??
        `${listing.title} available ${listing.purpose === "sale" ? "for sale" : "for rent"}`,
      openGraph: {
        title: listing.title,
        description: listing.description ?? undefined,
        images: firstImage ? [{ url: firstImage }] : undefined,
      },
    };
  } catch {
    return { title: "Listing" };
  }
}

export default async function PublicListingPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug, id } = await params;

  let listing;
  try {
    listing = await publicSiteRepository.getListing(slug, extractListingId(id));
  } catch {
    notFound();
  }

  return <ListingDetailShell listing={listing} slug={slug} />;
}
