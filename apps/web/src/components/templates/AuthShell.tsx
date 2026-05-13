import type { ReactNode } from "react";
import { Building2 } from "lucide-react";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  /** Text shown in the left brand panel tagline */
  brandTagline?: string;
  /** Small label under tagline */
  brandSublabel?: string;
  /** Brand name shown in left panel */
  brandName?: string;
  /**
   * Gradient direction classes for the left panel.
   * Defaults to deep teal (tenant login).
   */
  panelGradient?: string;
}

export function AuthShell({
  children,
  title,
  subtitle,
  brandTagline = "Run your real estate company from one place — listings, leads, deals, agents, and your public site.",
  brandSublabel = "Real Estate Operations",
  brandName = "AqarFlow",
  panelGradient = "from-teal-900 via-teal-800 to-teal-950",
}: AuthShellProps): React.ReactElement {
  return (
    <div className="min-h-screen flex">
      {/* LEFT brand panel */}
      <div
        className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${panelGradient} relative overflow-hidden flex-col`}
      >
        {/* Subtle glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-white/5 blur-[90px]" />
          <div className="absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full bg-white/5 blur-[70px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full px-14 xl:px-20 py-12">
          {/* Logo card */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">{brandName}</span>
          </div>

          {/* Tagline */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-3xl xl:text-4xl font-bold text-white leading-snug -tracking-[0.5px] max-w-sm">
              {brandTagline}
            </p>
            <span className="mt-5 inline-block text-xs font-semibold uppercase tracking-widest text-white/50">
              {brandSublabel}
            </span>

            {/* Feature bullets */}
            <div className="mt-10 space-y-3">
              {[
                "Listings, leads & pipeline — one view",
                "Agent management & commission tracking",
                "Branded public site, out of the box",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 flex-shrink-0" />
                  <span className="text-sm text-white/60">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} AqarFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* RIGHT form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#faf9f6] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-900">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">{brandName}</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
