import { ClosedDealsReport } from "@/components/organisms/ClosedDealsReport";

export default function ClosedDealsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Closed Deals Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Closed deals with commission summary. Export to CSV for finance.
        </p>
      </div>
      <ClosedDealsReport />
    </div>
  );
}
