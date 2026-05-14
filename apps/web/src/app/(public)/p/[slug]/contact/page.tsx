import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import { resolveConfig } from "@/lib/utils/resolve-site-config";
import { ContactSection } from "@/components/public-site/ContactSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const profile = await publicSiteRepository.getProfile(slug);
    return {
      title: `Contact — ${profile.name}`,
      description: `Get in touch with ${profile.name}`,
    };
  } catch {
    return { title: "Contact" };
  }
}

export default async function ContactPage({ params }: PageProps): Promise<React.ReactElement> {
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
      <ContactSection slug={slug} profile={profile} cfg={cfg.contact} />
    </div>
  );
}
