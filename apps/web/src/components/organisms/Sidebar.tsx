"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  UserCog,
  UsersRound,
  Home,
  Target,
  FileCheck,
  Handshake,
  ExternalLink,
  LogOut,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicSiteSettings } from "@/hooks/queries/tenant-public-site/usePublicSiteSettings";
import { useLogout } from "@/hooks/mutations/useAuthMutations";
import { RoleBadge } from "@/components/atoms/RoleBadge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

/** Items are not to be reordered — grouping is visual only */
const MAIN_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const MANAGE_ITEMS: NavItem[] = [
  { href: "/agents", label: "Agents", icon: UserCog },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/document-requests", label: "Doc Requests", icon: FileCheck },
  { href: "/deals", label: "Deals", icon: Handshake },
];

const TOOLS_ITEMS: NavItem[] = [
  { href: "/settings/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/settings/profile", label: "Profile", icon: Settings },
  { href: "/settings/company", label: "Company", icon: Building2, adminOnly: true },
  { href: "/settings/email-templates", label: "Email Templates", icon: Mail, adminOnly: true },
];

const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);

function SectionLabel({ label }: { label: string }): React.ReactElement {
  return (
    <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 first:mt-0">
      {label}
    </p>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }): React.ReactElement {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { data: publicSiteSettings } = usePublicSiteSettings();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const isAdmin = currentUser && ADMIN_ROLES.has(currentUser.role);

  const showPublicSiteLink =
    publicSiteSettings?.public_site_enabled === true && !!publicSiteSettings.slug;

  function filterAdmin(items: NavItem[]): NavItem[] {
    return items.filter((item) => !item.adminOnly || isAdmin);
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 px-6">
        <span className="text-lg font-bold tracking-tight">AqarFlow</span>
        {showPublicSiteLink && (
          <a
            href={`/p/${publicSiteSettings.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sidebar-foreground/60 transition hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            title="View public site"
          >
            <ExternalLink className="h-3 w-3" />
            Site
          </a>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <SectionLabel label="Main" />
        {filterAdmin(MAIN_ITEMS).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname === item.href} />
        ))}

        <SectionLabel label="Manage" />
        {filterAdmin(MANAGE_ITEMS).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
        ))}

        <SectionLabel label="Tools" />
        {filterAdmin(TOOLS_ITEMS).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
        ))}
      </nav>

      {/* User card */}
      {currentUser && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            {/* Avatar */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
              {getInitials(currentUser.full_name)}
            </div>
            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">
                {currentUser.full_name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50 leading-tight">
                {currentUser.email}
              </p>
              <div className="mt-1">
                <RoleBadge role={currentUser.role} />
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-1">
              <Link
                href="/settings/profile"
                className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => logout()}
                disabled={loggingOut}
                className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors disabled:opacity-40"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
