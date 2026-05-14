import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { publicSiteRepository } from "@/lib/api/repositories/public-site.repository";
import { resolveConfig } from "@/lib/utils/resolve-site-config";
import { PublicSiteHeader } from "@/components/public-site/PublicSiteHeader";
import { PublicSiteFooter } from "@/components/public-site/PublicSiteFooter";
import type { PublicTenantProfile } from "@/lib/types/public-site";

interface SlugLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Minimal synthetic profile used when the site is in direct_only mode.
 * The layout fetches it from the listing detail via the slug-only profile
 * endpoint (which returns 404), so we fall back to an empty-ish shell.
 * Children (listing-detail page) build the full branding from the listing
 * response's tenant_* fields.
 */
function makeFallbackProfile(slug: string): PublicTenantProfile {
  return {
    name: slug,
    logo_url: null,
    tagline: null,
    contact_email: "",
    contact_phone: "",
    operating_countries: ["AE"],
    config: null,
  };
}

export default async function SlugLayout({ children, params }: SlugLayoutProps): Promise<React.ReactElement> {
  const { slug } = await params;

  let profile: PublicTenantProfile;
  let isDirect = false;

  try {
    profile = await publicSiteRepository.getProfile(slug);
  } catch (err: unknown) {
    // 404 is expected in direct_only mode (and for truly missing slugs).
    // We can't distinguish them here without a round-trip; the child page's
    // own fetch will 404 correctly for disabled or missing slugs.
    // Treat any profile-fetch failure as potential direct_only: render a
    // minimal shell and let the child page content fill in the branding.
    const status =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;

    if (status === 404) {
      profile = makeFallbackProfile(slug);
      isDirect = true;
    } else {
      // Non-404 errors (network, 5xx) → show not found for safety
      notFound();
      return <></>;
    }
  }

  const cfg = resolveConfig(isDirect ? null : profile.config);
  const themeStyle = {
    "--primary": cfg.theme.primary_color,
    "--accent": cfg.theme.accent_color,
  } as React.CSSProperties;

  return (
    <div className="flex min-h-screen flex-col bg-white" style={themeStyle}>
      <PublicSiteHeader profile={profile} slug={slug} isDirect={isDirect} />
      <main className="flex-1">
        {children}
      </main>
      <PublicSiteFooter profile={profile} cfg={cfg.footer} />
    </div>
  );
}
