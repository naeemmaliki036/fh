import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import { ListingsPageShell } from "@/components/public-site/ListingsPageShell";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const profile = await publicSiteRepository.getProfile(slug);
    return {
      title: `${profile.name} - Properties`,
      description: profile.tagline ?? `Browse properties listed by ${profile.name}`,
      openGraph: {
        title: `${profile.name} - Properties`,
        description: profile.tagline ?? `Browse properties listed by ${profile.name}`,
      },
    };
  } catch {
    return { title: "Properties" };
  }
}

export default async function PublicSitePage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;

  let profile;
  try {
    profile = await publicSiteRepository.getProfile(slug);
  } catch {
    notFound();
  }

  return <ListingsPageShell profile={profile} slug={slug} />;
}
