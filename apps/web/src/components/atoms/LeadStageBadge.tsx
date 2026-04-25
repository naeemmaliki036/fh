import { Badge } from "@/components/ui/badge";
import type { LeadStage } from "@/lib/types/lead";

type Variant = "secondary" | "default" | "success" | "warning" | "destructive" | "outline";

const CONFIG: Record<LeadStage, { label: string; variant: Variant }> = {
  new:       { label: "New",       variant: "secondary" },
  contacted: { label: "Contacted", variant: "default" },
  qualified: { label: "Qualified", variant: "default" },
  viewing:   { label: "Viewing",   variant: "warning" },
  offer:     { label: "Offer",     variant: "warning" },
  won:       { label: "Won",       variant: "success" },
  lost:      { label: "Lost",      variant: "destructive" },
};

export function LeadStageBadge({ stage }: { stage: LeadStage }): React.ReactElement {
  const { label, variant } = CONFIG[stage] ?? { label: stage, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
