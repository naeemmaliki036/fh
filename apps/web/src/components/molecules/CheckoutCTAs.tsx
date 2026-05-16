import { Phone, MessageCircle } from "lucide-react";

interface CheckoutCTAsProps {
  agentPhone: string | null | undefined;
  agentName: string;
  listingTitle: string;
}

function toE164(phone: string): string {
  return phone.replace(/^\+/, "").replace(/\s+/g, "");
}

function buildWhatsAppUrl(phone: string, agentName: string, title: string): string {
  const text = `Hi ${agentName}, I'm interested in: ${title}`;
  return `https://wa.me/${toE164(phone)}?text=${encodeURIComponent(text)}`;
}

export function CheckoutCTAs({ agentPhone, agentName, listingTitle }: CheckoutCTAsProps): React.ReactElement | null {
  if (!agentPhone) return null;

  const waUrl = buildWhatsAppUrl(agentPhone, agentName, listingTitle);

  return (
    <div className="flex gap-3">
      <a
        href={`tel:${agentPhone}`}
        aria-label={`Call ${agentName}`}
        className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
      >
        <Phone className="h-4 w-4 shrink-0" />
        Call
      </a>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${agentName}`}
        className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        WhatsApp
      </a>
    </div>
  );
}
