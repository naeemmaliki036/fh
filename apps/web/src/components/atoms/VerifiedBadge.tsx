import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  verifiedBy?: string | null;
}

export function VerifiedBadge({ verifiedBy }: VerifiedBadgeProps): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      Verified
      {verifiedBy && (
        <span className="font-normal text-emerald-600">by {verifiedBy}</span>
      )}
    </span>
  );
}
