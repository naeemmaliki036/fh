import { TenantsTable } from "@/components/organisms/TenantsTable";

export default function TenantsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all registered companies on the platform
        </p>
      </div>
      <TenantsTable />
    </div>
  );
}
