import { Badge } from "@/components/ui/badge";
import type { DocumentRequestStatus } from "@/lib/types/document-request";

type Variant = "secondary" | "warning" | "success" | "destructive" | "outline";

const CONFIG: Record<DocumentRequestStatus, { label: string; variant: Variant }> = {
  pending:  { label: "Pending",  variant: "secondary" },
  partial:  { label: "Partial",  variant: "warning" },
  complete: { label: "Complete", variant: "success" },
  expired:  { label: "Expired",  variant: "destructive" },
  canceled: { label: "Canceled", variant: "outline" },
};

export function DocRequestStatusBadge({ status }: { status: DocumentRequestStatus }): React.ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={variant}>{label}</Badge>;
}
