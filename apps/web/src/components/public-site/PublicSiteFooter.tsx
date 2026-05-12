import type { PublicTenantProfile } from "@/lib/types/public-site";

interface PublicSiteFooterProps {
  profile: PublicTenantProfile;
}

export function PublicSiteFooter({ profile }: PublicSiteFooterProps): React.ReactElement {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold">{profile.name}</p>
        <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:gap-4">
          {profile.contact_email && (
            <a
              href={`mailto:${profile.contact_email}`}
              className="hover:text-foreground transition-colors"
            >
              {profile.contact_email}
            </a>
          )}
          {profile.contact_phone && (
            <a
              href={`tel:${profile.contact_phone}`}
              className="hover:text-foreground transition-colors"
            >
              {profile.contact_phone}
            </a>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
