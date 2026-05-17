"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { MarketplaceAgent } from "@fh/portal-types";

interface AgentCardProps {
  agent: MarketplaceAgent;
}

function Initials({ name }: { name: string }): React.ReactElement {
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  return (
    <span className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center text-lg font-black text-teal-700 shrink-0">
      {letters || "?"}
    </span>
  );
}

export function AgentCard({ agent }: AgentCardProps): React.ReactElement {
  const whatsappHref = agent.whatsapp
    ? `https://wa.me/${agent.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col gap-4 hover:border-teal-200 hover:shadow-md transition-all">
      {/* Avatar + name */}
      <div className="flex items-start gap-4">
        {agent.photo_url ? (
          <img
            src={agent.photo_url}
            alt={agent.full_name}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <Initials name={agent.full_name} />
        )}

        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 leading-tight truncate">
            {agent.full_name}
          </p>
          {agent.license_id && (
            <span className="inline-block mt-0.5 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[9px] font-bold text-teal-700 uppercase tracking-wide">
              RERA verified
            </span>
          )}

          {/* Agency snippet */}
          <Link
            href={`/agencies/${agent.agency.slug}`}
            className="mt-1.5 flex items-center gap-1.5 hover:underline w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            {agent.agency.logo_url ? (
              <img
                src={agent.agency.logo_url}
                alt={agent.agency.name}
                className="h-4 w-4 rounded object-contain"
              />
            ) : null}
            <span className="text-xs text-slate-500 font-semibold truncate max-w-[140px]">
              {agent.agency.name}
            </span>
          </Link>
        </div>
      </div>

      {/* Active listings badge */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {agent.active_listings_count} active listing{agent.active_listings_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Contact pills */}
      <div className="flex flex-wrap gap-2">
        {agent.email && (
          <a
            href={`mailto:${agent.email}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
          >
            <Mail className="h-3 w-3" />
            Email
          </a>
        )}
        {agent.phone && (
          <a
            href={`tel:${agent.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
          >
            <Phone className="h-3 w-3" />
            Call
          </a>
        )}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          >
            {/* WhatsApp icon inline SVG — no new deps */}
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
