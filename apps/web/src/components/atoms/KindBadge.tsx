import { Badge } from "@/components/ui/badge";
import type { PrivateDocumentKind } from "@/lib/types/private-document";

const KIND_LABELS: Record<PrivateDocumentKind, string> = {
  rera_id: "RERA ID",
  passport: "Passport",
  emirates_id: "Emirates ID",
  trade_license: "Trade License",
  noc: "NOC",
  contract: "Contract",
  kyc: "KYC",
  other: "Other",
};

interface KindBadgeProps {
  kind: PrivateDocumentKind;
}

export function KindBadge({ kind }: KindBadgeProps): React.ReactElement {
  return <Badge variant="secondary">{KIND_LABELS[kind] ?? kind}</Badge>;
}
