import { Badge } from "@/components/ui/badge";
import type { DealStage } from "@/lib/types/deal";

type Variant = "secondary" | "default" | "success" | "warning" | "destructive" | "outline";

const CONFIG: Record<DealStage, { label: string; variant: Variant }> = {
  initiated:          { label: "Initiated",          variant: "secondary" },
  documents_pending:  { label: "Docs Pending",       variant: "default" },
  deposit_pending:    { label: "Deposit Pending",    variant: "warning" },
  closed_won:         { label: "Closed Won",         variant: "success" },
  closed_lost:        { label: "Closed Lost",        variant: "destructive" },
  canceled:           { label: "Canceled",           variant: "outline" },
};

export function DealStageBadge({ stage }: { stage: DealStage }): React.ReactElement {
  const { label, variant } = CONFIG[stage] ?? { label: stage, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
