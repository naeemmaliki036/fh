import type { ReactElement } from "react";
import type { TenantActivityEntry } from "@/lib/types";

interface TenantActivityTabProps {
  activities: TenantActivityEntry[];
}

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function TenantActivityTab({ activities }: TenantActivityTabProps): ReactElement {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity recorded yet.</p>
    );
  }

  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <ol className="space-y-0 border-l border-border ml-2">
      {sorted.map((entry) => (
        <li key={entry.id} className="relative pl-6 pb-6 last:pb-0">
          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          <p className="text-sm font-medium">{entry.action}</p>
          {entry.diff_summary && (
            <p className="text-xs text-muted-foreground mt-0.5">{entry.diff_summary}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {entry.actor_name ?? "System"} &middot; {timeAgo(entry.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
