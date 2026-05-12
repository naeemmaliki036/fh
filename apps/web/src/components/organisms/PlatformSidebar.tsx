"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePlatformLogout } from "@/hooks/mutations/useAuthMutations";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function roleLabel(role: string): string {
  return role.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PlatformSidebar(): React.ReactElement {
  const pathname = usePathname();
  const { mutate: logout, isPending } = usePlatformLogout();
  const { currentPlatformUser } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold tracking-tight">AqarFlow</span>
        <span className="ml-1.5 text-xs text-sidebar-foreground/60">Platform</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
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

      <div className="border-t border-sidebar-border p-3 space-y-2">
        {currentPlatformUser && (
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
              {currentPlatformUser.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{currentPlatformUser.full_name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {currentPlatformUser.email}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
                {roleLabel(currentPlatformUser.role)}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logout()}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
