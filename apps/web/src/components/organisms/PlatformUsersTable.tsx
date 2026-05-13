"use client";

import type { ReactElement } from "react";
import { usePlatformUsers } from "@/hooks/queries/usePlatformUsers";
import { useAuth } from "@/contexts/AuthContext";
import { PlatformUserRoleBadge } from "@/components/molecules/PlatformUserRoleBadge";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { EditPlatformUserDialog } from "@/components/organisms/EditPlatformUserDialog";
import { ResetPasswordDialog } from "@/components/organisms/ResetPasswordDialog";
import { Button } from "@/components/ui/button";

function fmt(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function PlatformUsersTable(): ReactElement {
  const { data, isLoading, error } = usePlatformUsers();
  const { currentPlatformUser } = useAuth();
  const users = data?.items ?? [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading users...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load platform users.</p>;

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
        <p className="text-sm font-medium">No platform users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Last login</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = currentPlatformUser?.id === user.id;
            return (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-3 font-medium">
                  {user.full_name}
                  {isSelf && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <PlatformUserRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(user.last_login_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <EditPlatformUserDialog
                      trigger={<Button size="sm" variant="outline">Edit</Button>}
                      user={user}
                      isSelf={isSelf}
                    />
                    <ResetPasswordDialog
                      trigger={<Button size="sm" variant="outline">Reset pwd</Button>}
                      userId={user.id}
                      userName={user.full_name}
                    />
                    {user.role === "super_admin" && (
                      <span
                        className="text-xs text-muted-foreground"
                        title="Super admin deletion is blocked by DB trigger; contact ops directly"
                      >
                        No delete
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
