import React from "react";
import { UserPlus, LayoutDashboard, Globe, TrendingUp, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StepProps {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  isLast: boolean;
}

function WorkflowStep({ step, icon: Icon, title, description, isLast }: StepProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Connector line — visible on md+ */}
      {!isLast && (
        <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-0.5 bg-gradient-to-r from-[#0f766e]/40 to-[#0f766e]/10 z-0" />
      )}

      <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#0f766e] flex items-center justify-center shadow-lg shadow-[#0f766e]/20 mb-4">
        <Icon className="w-6 h-6 text-white" />
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-[#0a0a0a] text-[9px] font-black flex items-center justify-center">
          {step}
        </span>
      </div>
      <h3 className="text-sm font-bold text-[#0a0a0a] mb-2 max-w-[140px]">{title}</h3>
      <p className="text-xs text-[#5a5a5a] leading-relaxed max-w-[160px]">{description}</p>
    </div>
  );
}

const WORKFLOW_STEPS = [
  {
    icon: UserPlus,
    title: "Tenant Signs Up",
    description: "Company registers and awaits platform admin approval before going live.",
  },
  {
    icon: LayoutDashboard,
    title: "Build the Workspace",
    description: "Owner invites team, adds properties, creates listings, and configures branding.",
  },
  {
    icon: Globe,
    title: "Public Site Goes Live",
    description: "Listings appear instantly on the tenant's public site with their custom theme.",
  },
  {
    icon: TrendingUp,
    title: "Leads → Deals",
    description: "Leads captured, assigned to agents, moved through stages, closed as deals with commission.",
  },
  {
    icon: ShieldCheck,
    title: "Full Audit Trail",
    description: "Every action logged — price changes, doc access, overrides — for compliance readiness.",
  },
] as const;

export function WorkflowSection(): React.ReactElement {
  return (
    <section id="workflow" className="bg-[#faf9f6] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            From signup to closed deal — five steps
          </h2>
          <p className="mt-4 text-lg text-[#4a4a4a] max-w-xl mx-auto">
            AqarFlow handles the entire lifecycle so your team can focus on selling, not managing software.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-4">
          {WORKFLOW_STEPS.map((step, index) => (
            <WorkflowStep
              key={step.title}
              step={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={index === WORKFLOW_STEPS.length - 1}
            />
          ))}
        </div>

        {/* Bottom call-out */}
        <div className="mt-16 bg-gradient-to-r from-[#0f766e] to-[#059669] rounded-2xl p-8 text-center text-white">
          <p className="text-lg font-semibold mb-1">Ready to see the full flow in action?</p>
          <p className="text-white/70 text-sm">Book a 20-minute walkthrough with our team.</p>
          <a
            href="/demo"
            className="inline-block mt-4 px-6 py-2.5 bg-white text-[#0f766e] font-bold rounded-full text-sm hover:bg-[#faf9f6] transition-colors"
          >
            Request a demo
          </a>
        </div>
      </div>
    </section>
  );
}
