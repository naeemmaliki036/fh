interface PostedAgoProps {
  days: number;
}

function format(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

export function PostedAgo({ days }: PostedAgoProps): React.ReactElement {
  return (
    <span className="text-xs text-muted-foreground">{format(days)}</span>
  );
}
