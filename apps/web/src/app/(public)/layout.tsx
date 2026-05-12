import type { ReactNode } from "react";
import "@/styles/globals.css";

export default function PublicLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background px-6 py-4">
        <span className="text-base font-bold tracking-tight">AqarFlow</span>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8">
        {children}
      </main>
    </div>
  );
}
