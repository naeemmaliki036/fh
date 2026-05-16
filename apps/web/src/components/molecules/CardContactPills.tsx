import { Phone, MessageCircle, Mail } from "lucide-react";

interface CardContactPillsProps {
  agentPhone: string | null | undefined;
  agentName: string;
  listingTitle: string;
}

function toE164(phone: string): string {
  return phone.replace(/^\+/, "").replace(/\s+/g, "");
}

export function CardContactPills({
  agentPhone,
  agentName,
  listingTitle,
}: CardContactPillsProps): React.ReactElement | null {
  if (!agentPhone) return null;

  const waText = encodeURIComponent(
    `Hi ${agentName}, I'm interested in: ${listingTitle}`,
  );
  const waUrl = `https://wa.me/${toE164(agentPhone)}?text=${waText}`;

  const pillClass =
    "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 transition hover:border-slate-400";

  const handleClick = (e: React.MouseEvent): void => {
    // Prevent the parent Link from navigating
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-1.5" onClick={handleClick}>
      <a href={`tel:${agentPhone}`} aria-label="Call agent" className={pillClass}>
        <Phone className="h-3 w-3" /> Call
      </a>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp agent"
        className={pillClass}
      >
        <MessageCircle className="h-3 w-3" /> WhatsApp
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(listingTitle)}`}
        aria-label="Email"
        className={pillClass}
      >
        <Mail className="h-3 w-3" /> Email
      </a>
    </div>
  );
}
