"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Heart,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useConsumer } from "@/lib/consumer-context";
import { useSignOut } from "@/hooks/mutations/useConsumerAuth";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";

const NAV = [
  { href: "/me", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/me/listings", label: "My listings", icon: Home, exact: false },
  { href: "/me/favorites", label: "Favorites", icon: Heart, exact: false },
  { href: "/me/profile", label: "Profile", icon: User, exact: false },
] as const;

function SidebarNav(): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const signOut = useSignOut();

  function handleSignOut(): void {
    signOut();
    router.replace("/");
  }

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col gap-1 pt-2">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition mt-2"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </aside>
  );
}

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { token, isHydrated } = useConsumer();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, token, router, pathname]);

  if (!isHydrated || !token) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <MarketplaceHeader />
        <main className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceHeader />
      <div className="mx-auto w-[min(100%-24px,1200px)] py-10 flex gap-8 items-start">
        <SidebarNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
