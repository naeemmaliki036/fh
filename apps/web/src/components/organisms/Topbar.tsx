"use client";

import { useAuth } from "@/contexts/AuthContext";
import { RoleBadge } from "@/components/atoms/RoleBadge";
import { NotificationsBell } from "@/components/organisms/NotificationsBell";

export function Topbar(): React.ReactElement {
  const { currentUser } = useAuth();

  return (
    <header className="flex h-16 items-center justify-end border-b bg-background px-6 gap-4">
      <NotificationsBell />
      {currentUser && (
        <div className="flex items-center gap-3">
          <RoleBadge role={currentUser.role} />
          <span className="text-sm font-medium">{currentUser.full_name}</span>
          <span className="text-xs text-muted-foreground">{currentUser.email}</span>
        </div>
      )}
    </header>
  );
}
