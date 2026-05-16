import { Badge } from "@/components/ui/badge";

type InterestStatus = "interested" | "won" | "lost";

type Variant = "secondary" | "success" | "destructive";

const CONFIG: Record<InterestStatus, { label: string; variant: Variant }> = {
  interested: { label: "Interested", variant: "secondary" },
  won:        { label: "Won",        variant: "success" },
  lost:       { label: "Lost",       variant: "destructive" },
};

interface InterestStatusBadgeProps {
  status: InterestStatus;
}

export function InterestStatusBadge({ status }: InterestStatusBadgeProps): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
