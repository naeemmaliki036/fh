import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import { resolveConfig } from "@/lib/utils/resolve-site-config";
import { TeamSection } from "@/components/public-site/TeamSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const profile = await publicSiteRepository.getProfile(slug);
    return {
      title: `Team — ${profile.name}`,
      description: `Meet the team at ${profile.name}`,
    };
  } catch {
    return { title: "Team" };
  }
}

export default async function TeamPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;

  let profile;
  try {
    profile = await publicSiteRepository.getProfile(slug);
  } catch {
    notFound();
  }

  const cfg = resolveConfig(profile.config);

  return (
    <div className="bg-white">
      <TeamSection slug={slug} cfg={cfg.team} />
    </div>
  );
}
