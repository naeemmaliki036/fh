import { DealsTable } from "@/components/organisms/DealsTable";

export default function DealsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track sales pipeline from initiation to close
        </p>
      </div>
      <DealsTable />
    </div>
  );
}
