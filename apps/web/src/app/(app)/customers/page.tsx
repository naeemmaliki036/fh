import { CustomersTable } from "@/components/organisms/CustomersTable";

export default function CustomersPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your customer records and KYC documents
        </p>
      </div>
      <CustomersTable />
    </div>
  );
}
