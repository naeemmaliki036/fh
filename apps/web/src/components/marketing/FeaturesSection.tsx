import React from "react";
import {
  Building2,
  Users,
  Target,
  FileCheck,
  Handshake,
  Globe,
  Plug,
  Shield,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

function FeatureTile({ icon: Icon, title, description, badge }: FeatureTileProps): React.ReactElement {
  return (
    <div className="relative bg-white rounded-2xl p-6 border border-black/8 hover:border-[#0f766e]/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
      {badge && (
        <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          {badge}
        </span>
      )}
      <div className="w-10 h-10 rounded-xl bg-[#0f766e]/10 flex items-center justify-center mb-4 group-hover:bg-[#0f766e]/15 transition-colors">
        <Icon className="w-5 h-5 text-[#0f766e]" />
      </div>
      <h3 className="text-base font-bold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-sm text-[#4a4a4a] leading-relaxed">{description}</p>
    </div>
  );
}

const FEATURES: FeatureTileProps[] = [
  {
    icon: Building2,
    title: "Properties & Listings",
    description:
      "Properties are your inventory records. Listings are what goes to market. Separate entities, clean relationship — no more confused data models.",
  },
  {
    icon: Target,
    title: "Leads & Pipeline",
    description:
      "Track leads through stages, assign to agents, log follow-ups, and never let a hot prospect go cold. Pipeline view included.",
  },
  {
    icon: FileCheck,
    title: "Document Collection",
    description:
      "Generate tokenized, expiring links for customers to upload KYC docs securely. Verification code protected, every action audit-logged.",
  },
  {
    icon: Handshake,
    title: "Deals & Commission",
    description:
      "Close deals, apply the agent commission chain, and allow authorized overrides at deal level — every change requires a reason and is logged.",
  },
  {
    icon: Globe,
    title: "Public Tenant Sites",
    description:
      "Each tenant gets a branded public-facing site with their listings, team bio, services, hero image, and custom colors — zero dev effort.",
  },
  {
    icon: Plug,
    title: "Portal Integrations",
    description:
      "Connector architecture ready for Bayut, Property Finder, and Dubizzle. Map internal listings to portal format, validate, then publish.",
    badge: "Coming soon",
  },
  {
    icon: Users,
    title: "Email Management",
    description:
      "Manage email templates, view the outbox, and audit delivery status. Build communication workflows without leaving AqarFlow.",
  },
  {
    icon: Shield,
    title: "Roles & Permissions",
    description:
      "RBAC across tenant roles (Owner, Admin, Agent, Finance) and platform roles (Super Admin, Ops, Finance). Enforced at service layer.",
  },
  {
    icon: Activity,
    title: "Audit Trail",
    description:
      "Full event timeline for price changes, status transitions, assignment changes, and document access — timestamped with actor and reason.",
  },
];

export function FeaturesSection(): React.ReactElement {
  return (
    <section id="features" className="bg-[#f4f3f0] py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-3">
            Platform features
          </p>
          <h2 className="text-4xl font-extrabold text-[#0a0a0a] tracking-tight max-w-2xl mx-auto">
            Everything your real-estate operations need
          </h2>
          <p className="mt-4 text-lg text-[#4a4a4a] max-w-xl mx-auto">
            From the first property upload to the final commission payout — and everything in between.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <FeatureTile key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
