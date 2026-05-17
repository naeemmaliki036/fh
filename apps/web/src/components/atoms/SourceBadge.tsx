import { Badge } from "@/components/ui/badge";
import type { CustomerSource } from "@/lib/types";

const LABELS: Record<CustomerSource, string> = {
  agent: "Agent",
  portal: "Portal",
  website: "Website",
  manual: "Manual",
  import: "Import",
  referral: "Referral",
  walk_in: "Walk-in",
  other: "Other",
};

interface SourceBadgeProps {
  source: CustomerSource;
}

export function SourceBadge({ source }: SourceBadgeProps): React.ReactElement {
  return <Badge variant="outline">{LABELS[source] ?? source}</Badge>;
}
