import type { PublicTenantProfile } from "@/lib/types/public-site";

interface PublicSiteFooterProps {
  profile: PublicTenantProfile;
}

export function PublicSiteFooter({ profile }: PublicSiteFooterProps): React.ReactElement {
  const initials = profile.name.slice(0, 2).toUpperCase();

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
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {profile.tagline ?? "Verified listings and a smooth process, end to end."}
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="mb-4 font-black">Quick links</h4>
          <a href="#listings" className="mt-3 block text-sm text-slate-400 transition hover:text-white">
            Listings
          </a>
          <a href="#agents" className="mt-3 block text-sm text-slate-400 transition hover:text-white">
            Agents
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
