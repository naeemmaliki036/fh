import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import { resolveConfig } from "@/lib/utils/resolve-site-config";
import { PublicSiteHeader } from "@/components/public-site/PublicSiteHeader";
import { PublicSiteFooter } from "@/components/public-site/PublicSiteFooter";

interface SlugLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function SlugLayout({ children, params }: SlugLayoutProps): Promise<React.ReactElement> {
  const { slug } = await params;

  let profile;
  try {
    profile = await publicSiteRepository.getProfile(slug);
  } catch {
    notFound();
  }

  const cfg = resolveConfig(profile.config);
  const themeStyle = {
    "--primary": cfg.theme.primary_color,
    "--accent": cfg.theme.accent_color,
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5ef]" style={themeStyle}>
      <PublicSiteHeader profile={profile} slug={slug} />
      <main className="flex-1">
        {children}
      </main>
      <PublicSiteFooter profile={profile} cfg={cfg.footer} />
    </div>
  );
}
