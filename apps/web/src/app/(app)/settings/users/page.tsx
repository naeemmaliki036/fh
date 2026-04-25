import { UsersTable } from "@/components/organisms/UsersTable";

export default function UsersPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage team members in your organization
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
