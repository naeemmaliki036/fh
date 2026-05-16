interface ReferenceBadgeProps {
  reference: string | null | undefined;
}

export function ReferenceBadge({ reference }: ReferenceBadgeProps): React.ReactElement | null {
  if (!reference) return null;
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {reference}
    </span>
  );
}
