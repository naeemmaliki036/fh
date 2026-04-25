import { PropertiesGrid } from "@/components/organisms/PropertiesGrid";

export default function PropertiesPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your property inventory
        </p>
      </div>
      <PropertiesGrid />
    </div>
  );
}
