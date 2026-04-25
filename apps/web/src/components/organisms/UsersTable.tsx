"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/queries/useUsers";
import { useDeleteUser } from "@/hooks/mutations/useUserMutations";
import { useAuth } from "@/contexts/AuthContext";
import { UserRow } from "@/components/molecules/UserRow";
import { UserFormDialog } from "@/components/organisms/UserFormDialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

const MANAGE_ROLES = new Set(["company_owner", "company_admin"]);

export function UsersTable(): React.ReactElement {
  const { data, isLoading, error } = useUsers();
  const { mutate: disableUser } = useDeleteUser();
  const { currentUser } = useAuth();
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const canManage = !!(currentUser && MANAGE_ROLES.has(currentUser.role));

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading users...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load users.</p>;

  const users = data?.items ?? [];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate(true)}>Add User</Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              {canManage && <th className="px-4 py-3 text-left font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                canManage={canManage}
                onEdit={setEditTarget}
                onDisable={disableUser}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <UserFormDialog mode="create" onClose={() => setShowCreate(false)} />
      )}
      {editTarget && (
        <UserFormDialog
          mode="edit"
          user={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
