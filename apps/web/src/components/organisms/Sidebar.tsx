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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LogoutButton } from "@/components/atoms/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: UserCog },
  { href: "/customers", label: "Customers", icon: UsersRound },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/document-requests", label: "Doc Requests", icon: FileCheck },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/settings/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/settings/profile", label: "Profile", icon: Settings },
  { href: "/settings/company", label: "Company", icon: Building2, adminOnly: true },
];

const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);

export function Sidebar(): React.ReactElement {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || (currentUser && ADMIN_ROLES.has(currentUser.role)),
  );

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold tracking-tight">fh</span>
        <span className="ml-1.5 text-xs text-sidebar-foreground/60 font-light">real estate</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
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
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <LogoutButton variant="ghost" showLabel />
      </div>
    </aside>
  );
}
