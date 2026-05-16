import { ShieldCheck } from "lucide-react";

interface CardAgentStripProps {
  agentName: string | null | undefined;
  agentPhotoUrl: string | null | undefined;
  agentHasLicense: boolean;
}

export function CardAgentStrip({
  agentName,
  agentPhotoUrl,
  agentHasLicense,
}: CardAgentStripProps): React.ReactElement | null {
  if (!agentName) return null;

  const initials = agentName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2 border-t border-slate-50 pt-2.5">
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-100">
        {agentPhotoUrl ? (
          <img
            src={agentPhotoUrl}
            alt={agentName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-black text-slate-600">
            {initials}
          </div>
        )}
      </div>
      <span className="truncate text-xs font-medium text-slate-700">{agentName}</span>
      {agentHasLicense && (
        <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          <ShieldCheck className="h-3 w-3" /> Verified
        </span>
      )}
    </div>
  );
}
