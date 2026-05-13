import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import type { EmailOutboxStatus } from "@/lib/types";

interface EmailOutboxStatusBadgeProps {
  status: EmailOutboxStatus;
}

const CONFIG: Record<EmailOutboxStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  queued: { label: "Queued", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  bounced: { label: "Bounced", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
};

export function EmailOutboxStatusBadge({ status }: EmailOutboxStatusBadgeProps): ReactElement {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}
