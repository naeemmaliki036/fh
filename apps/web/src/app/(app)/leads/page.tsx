import { LeadsTable } from "@/components/organisms/LeadsTable";

export default function LeadsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage your sales pipeline</p>
      </div>
      <LeadsTable />
    </div>
  );
}
