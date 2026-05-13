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
  CalendarDays,
  ListChecks,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicSiteSettings } from "@/hooks/queries/tenant-public-site/usePublicSiteSettings";
import { useLogout } from "@/hooks/mutations/useAuthMutations";
import { useMyPendingReviews } from "@/hooks/queries/useListings";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  reviewerOnly?: boolean;
}

const MAIN_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const MANAGE_ITEMS: NavItem[] = [
  { href: "/agents", label: "Agents", icon: UserCog },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/listings", label: "Listings", icon: ListChecks },
  { href: "/listings/pending-reviews", label: "Pending Reviews", icon: ClipboardList, reviewerOnly: true },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
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
const REVIEWER_ROLES = new Set(["listing_manager", "company_admin", "company_owner"]);

function SectionLabel({ label }: { label: string }): React.ReactElement {
  return (
    <p className="mb-1 mt-4 px-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground first:mt-0">
      {label}
    </p>
  );
}

function NavLink({ item, isActive, badge }: { item: NavItem; isActive: boolean; badge?: number }): React.ReactElement {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {badge != null && badge > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground min-w-[1.1rem]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
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

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    company_owner: "Company Owner",
    company_admin: "Company Admin",
    property_admin: "Property Admin",
    listing_manager: "Listing Mgr",
    agent: "Agent",
    finance_user: "Finance",
    read_only: "Read Only",
  };
  return labels[role] ?? role;
}

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { data: publicSiteSettings } = usePublicSiteSettings();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const isAdmin = currentUser && ADMIN_ROLES.has(currentUser.role);
  const isReviewer = currentUser && REVIEWER_ROLES.has(currentUser.role);

  const { data: pendingReviewsData } = useMyPendingReviews(isReviewer ? (currentUser?.id ?? "") : "");
  const pendingReviewCount = pendingReviewsData?.total ?? 0;

  const showPublicSiteLink =
    publicSiteSettings?.public_site_enabled === true && !!publicSiteSettings.slug;

  function filterNav(items: NavItem[]): NavItem[] {
    return items.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.reviewerOnly && !isReviewer) return false;
      return true;
    });
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <span className="text-lg font-bold tracking-tight text-foreground">AqarFlow</span>
        {showPublicSiteLink && (
          <a
            href={`/p/${publicSiteSettings.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
        {filterNav(MAIN_ITEMS).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname === item.href} />
        ))}

        <SectionLabel label="Manage" />
        {filterNav(MANAGE_ITEMS).map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
            badge={item.href === "/listings/pending-reviews" ? pendingReviewCount : undefined}
          />
        ))}

        <SectionLabel label="Tools" />
        {filterNav(TOOLS_ITEMS).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
        ))}
      </nav>

      {/* User card */}
      {currentUser && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            {/* Avatar */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
              {getInitials(currentUser.full_name)}
            </div>
            {/* Name + email + role */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground leading-tight">
                {currentUser.full_name}
              </p>
              <p className="truncate text-xs text-muted-foreground leading-tight">
                {currentUser.email}
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-1">
              <Link
                href="/settings/profile"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => logout()}
                disabled={loggingOut}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                title="Sign out"
                aria-label="Sign out"
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
