import type { PublicTenantProfile } from "@/lib/types/public-site";

interface PublicSiteHeaderProps {
  profile: PublicTenantProfile;
}

export function PublicSiteHeader({ profile }: PublicSiteHeaderProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
        {profile.logo_url && (
          <img
            src={profile.logo_url}
            alt={profile.name}
            className="h-9 w-auto object-contain"
          />
        )}
        <span className="text-lg font-bold tracking-tight">{profile.name}</span>
      </div>
    </header>
  );
}
