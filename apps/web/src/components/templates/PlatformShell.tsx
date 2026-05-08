import type { ReactNode } from "react";
import { PlatformSidebar } from "@/components/organisms/PlatformSidebar";
import { NotificationBell } from "@/components/molecules/NotificationBell";

interface PlatformShellProps {
  children: ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps): React.ReactElement {
  return (
    <div className="flex h-screen overflow-hidden">
      <PlatformSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end border-b bg-background px-6 gap-2">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
