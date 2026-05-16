import type { CustomerDetail } from "@/lib/types/customer";

interface Row {
  label: string;
  value: string | null | undefined;
}

function InfoRow({ label, value }: Row): React.ReactElement {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground col-span-1">{label}</span>
      <span className="text-sm col-span-2">{value ?? <span className="text-muted-foreground italic">—</span>}</span>
    </div>
  );
}

interface CustomerInfoPanelProps {
  customer: CustomerDetail;
}

export function CustomerInfoPanel({ customer }: CustomerInfoPanelProps): React.ReactElement {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-0">
      <InfoRow label="Full name" value={customer.full_name} />
      <InfoRow label="Phone" value={customer.phone} />
      <InfoRow label="Email" value={customer.email} />
      <InfoRow label="Nationality" value={customer.nationality} />
      <InfoRow label="Language" value={customer.language} />
      <InfoRow label="Preferred currency" value={customer.preferred_currency} />
      <InfoRow label="Source" value={customer.source?.replace(/_/g, " ")} />
      <InfoRow label="Status" value={customer.status} />
      <InfoRow label="Assigned agent" value={customer.assigned_agent_name} />
      <InfoRow label="Notes" value={customer.notes} />
    </div>
  );
}
