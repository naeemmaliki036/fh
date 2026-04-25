import type { ReactNode } from "react";
import { PlatformSidebar } from "@/components/organisms/PlatformSidebar";

interface PlatformShellProps {
  children: ReactNode;
}

export function PlatformShell({ children }: PlatformShellProps): React.ReactElement {
  return (
    <div className="flex h-screen overflow-hidden">
      <PlatformSidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        {children}
      </main>
    </div>
  );
}
