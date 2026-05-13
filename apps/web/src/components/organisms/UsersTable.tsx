"use client";

import { useState, useEffect } from "react";
import { UserIcon, Plus } from "lucide-react";
import { useUsers } from "@/hooks/queries/useUsers";
import { Input } from "@/components/ui/input";
import { useChangeUserStatus } from "@/hooks/mutations/useUserMutations";
import { useAuth } from "@/contexts/AuthContext";
import { UserRow } from "@/components/molecules/UserRow";
import { UserFormDialog } from "@/components/organisms/UserFormDialog";
import { StatusChangeDialog } from "@/components/molecules/StatusChangeDialog";
import { Button } from "@/components/ui/button";
import { USER_DISABLED_REASONS, USER_ACTIVE_REASONS } from "@/lib/constants/status-reasons";
import type { User, UserStatus } from "@/lib/types";

const MANAGE_ROLES = new Set(["company_owner", "company_admin"]);

type PendingTransition = {
  user: User;
  targetStatus: UserStatus;
};

export function UsersTable(): React.ReactElement {
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const { data, isLoading, error } = useUsers({ q: debouncedQ || undefined });
  const { mutateAsync: changeStatus } = useChangeUserStatus();
  const { currentUser } = useAuth();
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pending, setPending] = useState<PendingTransition | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const canManage = !!(currentUser && MANAGE_ROLES.has(currentUser.role));

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading users...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load users.</p>;

  const users = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        {canManage && (
          <Button className="ml-auto" onClick={() => setShowCreate(true)}>Add User</Button>
        )}
      </div>

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
                onStatusChange={(u, targetStatus) => setPending({ user: u, targetStatus })}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <UserIcon className="h-8 w-8 text-muted-foreground/50" />
                    <div>
                      <p className="text-sm font-medium">No users yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Invite a user to give them access to this workspace.</p>
                    </div>
                    {canManage && (
                      <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1.5 h-4 w-4" />New User</Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
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

      {pending && (
        <StatusChangeDialog
          open
          onOpenChange={(o) => { if (!o) setPending(null); }}
          title={
            pending.targetStatus === "disabled"
              ? `Disable ${pending.user.full_name}?`
              : `Enable ${pending.user.full_name}?`
          }
          description={
            pending.targetStatus === "disabled"
              ? "This user will no longer be able to log in."
              : "This user will be restored and can log in again."
          }
          reasonOptions={
            pending.targetStatus === "disabled" ? USER_DISABLED_REASONS : USER_ACTIVE_REASONS
          }
          destructive={pending.targetStatus === "disabled"}
          onConfirm={async (reason_code, reason_note) => {
            await changeStatus({
              id: pending.user.id,
              status: pending.targetStatus,
              reason_code,
              reason_note,
            });
          }}
        />
      )}
    </div>
  );
}
