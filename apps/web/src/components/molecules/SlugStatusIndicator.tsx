export type SlugStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "taken" }
  | { kind: "invalid" };

interface SlugStatusIndicatorProps {
  status: SlugStatus;
}

export function SlugStatusIndicator({ status }: SlugStatusIndicatorProps): React.ReactElement | null {
  if (status.kind === "idle") return null;
  if (status.kind === "checking") {
    return <p className="text-xs text-muted-foreground">Checking availability…</p>;
  }
  if (status.kind === "available") {
    return <p className="text-xs text-green-600">Slug is available</p>;
  }
  if (status.kind === "taken") {
    return <p className="text-xs text-destructive">Slug is already taken</p>;
  }
  return <p className="text-xs text-destructive">Only lowercase letters, numbers, hyphens</p>;
}
