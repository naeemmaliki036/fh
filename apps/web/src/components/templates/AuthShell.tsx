import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">fh</span>
              <span className="text-xs text-muted-foreground font-light">real estate</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
