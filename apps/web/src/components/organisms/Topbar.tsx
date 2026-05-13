"use client";

import { useMyTenant } from "@/hooks/queries/useTenants";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { NotificationsBell } from "@/components/organisms/NotificationsBell";

export function Topbar(): React.ReactElement {
  const { data: tenant } = useMyTenant();

  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-background px-6 gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        {tenant?.name ?? "…"}
      </span>
      <ThemeToggle />
      <NotificationsBell />
    </header>
  );
}
