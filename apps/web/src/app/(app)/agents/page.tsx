import { AgentsTable } from "@/components/organisms/AgentsTable";

export default function AgentsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your real estate agents and their compliance documents
        </p>
      </div>
      <AgentsTable />
    </div>
  );
}
