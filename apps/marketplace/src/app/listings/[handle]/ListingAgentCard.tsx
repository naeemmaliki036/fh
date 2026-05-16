import Link from "next/link";
import { Phone, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import type { MarketplaceListingDetail } from "@fh/portal-types";
import { PORTAL_BRAND_NAME } from "@/lib/portal-brand";

interface ListingAgentCardProps {
  listing: MarketplaceListingDetail;
}

export function ListingAgentCard({ listing }: ListingAgentCardProps): React.ReactElement | null {
  const agentName = listing.agent_name ?? null;
  if (!agentName) return null;

  const agentPhoto = listing.agent_photo_url ?? null;
  const agentLicensed = listing.agent_has_license ?? false;
  const agentPhone = listing.agent_phone ?? null;
  const agentEmail = listing.agent_email ?? null;
  const agentWhatsapp = listing.agent_whatsapp ?? null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
      <div className="flex items-center gap-3">
        {agentPhoto ? (
          <img
            src={agentPhoto}
            alt={agentName}
            className="h-14 w-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="h-14 w-14 rounded-full bg-teal-50 flex items-center justify-center text-sm font-bold text-teal-600 shrink-0">
            {agentName.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900">{agentName}</p>
          {agentLicensed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 uppercase">
              <ShieldCheck className="h-3 w-3" /> RERA Verified
            </span>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            <Link
              href={`/agencies/${listing.tenant.slug}`}
              className="hover:text-teal-600 transition"
            >
              {listing.tenant.name}
            </Link>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {agentPhone && (
          <a
            href={`tel:${agentPhone}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-100 transition"
          >
            <Phone className="h-4 w-4" /> Call
          </a>
        )}
        {agentWhatsapp && (
          <a
            href={`https://wa.me/${agentWhatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
        {agentEmail && (
          <a
            href={`mailto:${agentEmail}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-teal-300 transition"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
        )}
      </div>

      {listing.tenant.logo_url && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
          <img
            src={listing.tenant.logo_url}
            alt={listing.tenant.name}
            className="h-8 w-8 rounded-lg object-contain border border-slate-100"
          />
          <span className="text-xs text-slate-400">
            Listed on {PORTAL_BRAND_NAME}
          </span>
        </div>
      )}
    </div>
  );
}
