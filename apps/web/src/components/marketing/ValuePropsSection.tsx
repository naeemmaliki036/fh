import React from "react";
import { Layers, Globe, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: boolean;
}

function ValueCard({ icon: Icon, title, description, accent = false }: ValueCardProps): React.ReactElement {
  return (
    <div
      className={`relative rounded-2xl p-8 border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group ${
        accent
          ? "bg-[#0f766e] border-[#0f766e] text-white"
          : "bg-white border-black/8 text-[#0a0a0a]"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
          accent ? "bg-white/15" : "bg-[#0f766e]/10"
        }`}
      >
        <Icon className={`w-6 h-6 ${accent ? "text-white" : "text-[#0f766e]"}`} />
      </div>
      <h3 className={`text-xl font-bold mb-3 ${accent ? "text-white" : "text-[#0a0a0a]"}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${accent ? "text-white/80" : "text-[#4a4a4a]"}`}>
        {description}
      </p>
    </div>
  );
}

const VALUE_PROPS = [
  {
    icon: Layers,
    title: "Multi-tenant from day one",
    description:
      "Manage many real-estate brands or branches from a single platform. Each tenant gets isolated data, their own branding, and a dedicated operations workspace.",
    accent: false,
  },
  {
    icon: Globe,
    title: "Public site included",
    description:
      "Every tenant gets a customizable public listings site at fhportal.com/p/your-slug — auto-built from their inventory, with their colors, logo, team, and contact info.",
    accent: true,
  },
  {
    icon: ShieldCheck,
    title: "Audit-ready operations",
    description:
      "Every commission override, price change, and status flip is logged with actor, timestamp, and reason. Built for compliance from the ground up.",
    accent: false,
  },
] as const;

export function ValuePropsSection(): React.ReactElement {
  return (
    <section className="bg-[#faf9f6] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-3">
            Why AqarFlow
          </p>
          <h2 className="text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            Built for how MENA real-estate actually works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {VALUE_PROPS.map((prop) => (
            <ValueCard
              key={prop.title}
              icon={prop.icon}
              title={prop.title}
              description={prop.description}
              accent={prop.accent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
