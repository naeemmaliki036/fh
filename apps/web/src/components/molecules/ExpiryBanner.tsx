"use client";

const MS_PER_HOUR = 3_600_000;
const MS_24H = 24 * MS_PER_HOUR;

interface ExpiryBannerProps {
  customerName: string | null;
  expiresAt: string;
  agentName: string | null;
  agentPhone: string | null;
}

export function ExpiryBanner({
  customerName,
  expiresAt,
  agentName,
  agentPhone,
}: ExpiryBannerProps): React.ReactElement {
  const expiryDate = new Date(expiresAt);
  const now = Date.now();
  const msLeft = expiryDate.getTime() - now;
  const isUrgent = msLeft > 0 && msLeft <= MS_24H;

  const formattedExpiry = expiryDate.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const bg = isUrgent ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-muted border-border text-foreground";

  return (
    <div className={`sticky top-0 z-10 rounded-xl border px-4 py-3 text-sm ${bg}`}>
      <div className="font-medium">
        Documents{customerName ? ` for ${customerName}` : ""} — Link expires on{" "}
        <strong>{formattedExpiry}</strong>
        {isUrgent && " (expires soon!)"}
      </div>
      {(agentName || agentPhone) && (
        <div className="mt-1 text-xs opacity-80">
          Agent: {agentName ?? ""}
          {agentPhone && <> &mdash; {agentPhone}</>}
        </div>
      )}
    </div>
  );
}
