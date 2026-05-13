import { Instagram, Facebook, Linkedin } from "lucide-react";
import type { PublicTenantProfile, FooterConfig } from "@/lib/types/public-site";

interface PublicSiteFooterProps {
  profile: PublicTenantProfile;
  cfg: FooterConfig;
}

export function PublicSiteFooter({ profile, cfg }: PublicSiteFooterProps): React.ReactElement {
  const initials = profile.name.slice(0, 2).toUpperCase();
  const description = cfg.description ?? (profile.tagline ?? "Verified listings and a smooth process, end to end.");

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid w-[min(100%-40px,1280px)] gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-3">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.name}
                className="h-10 w-10 rounded-2xl bg-white object-contain p-0.5"
              />
            ) : (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950">
                {initials}
              </span>
            )}
            <span>
              <strong className="block font-black">{profile.name}</strong>
              <small className="mt-0.5 block text-xs text-slate-400">Real Estate</small>
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
          {cfg.address && (
            <p className="mt-3 text-xs text-slate-500">{cfg.address}</p>
          )}
          {(cfg.instagram_url || cfg.facebook_url || cfg.linkedin_url) && (
            <div className="mt-4 flex gap-3">
              {cfg.instagram_url && (
                <a href={cfg.instagram_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 transition hover:text-white" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {cfg.facebook_url && (
                <a href={cfg.facebook_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 transition hover:text-white" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {cfg.linkedin_url && (
                <a href={cfg.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 transition hover:text-white" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h4 className="mb-4 font-black">Quick links</h4>
          <a href="#listings" className="mt-3 block text-sm text-slate-400 transition hover:text-white">
            Listings
          </a>
          <a href="#team" className="mt-3 block text-sm text-slate-400 transition hover:text-white">
            Team
          </a>
          <a href="#contact" className="mt-3 block text-sm text-slate-400 transition hover:text-white">
            Contact
          </a>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="mb-4 font-black">Contact</h4>
          {profile.contact_email && (
            <a
              href={`mailto:${profile.contact_email}`}
              className="mt-3 block text-sm text-slate-400 transition hover:text-white"
            >
              {profile.contact_email}
            </a>
          )}
          {profile.contact_phone && (
            <a
              href={`tel:${profile.contact_phone}`}
              className="mt-3 block text-sm text-slate-400 transition hover:text-white"
            >
              {profile.contact_phone}
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {profile.name}. All rights reserved.
      </div>
    </footer>
  );
}
