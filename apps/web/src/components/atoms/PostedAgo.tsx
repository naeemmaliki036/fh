interface PostedAgoProps {
  createdAt?: string | null;
  days?: number | null;
}

function formatDiff(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 min ago" : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "Yesterday" : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months <= 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function PostedAgo({ createdAt, days }: PostedAgoProps): React.ReactElement | null {
  let label = "";
  if (createdAt) {
    const ts = Date.parse(createdAt);
    if (!Number.isNaN(ts)) label = formatDiff(Date.now() - ts);
  } else if (typeof days === "number" && Number.isFinite(days)) {
    label = formatDiff(days * 24 * 60 * 60 * 1000);
  }
  if (!label) return null;
  return <span className="text-xs text-muted-foreground">{label}</span>;
}
