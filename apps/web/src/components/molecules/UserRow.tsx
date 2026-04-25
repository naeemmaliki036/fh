import { StatusBadge } from "@/components/atoms/StatusBadge";
import { RoleBadge } from "@/components/atoms/RoleBadge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

interface UserRowProps {
  user: User;
  canManage: boolean;
  onEdit: (user: User) => void;
  onDisable: (id: string) => void;
}

export function UserRow({ user, canManage, onEdit, onDisable }: UserRowProps): React.ReactElement {
  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium">{user.full_name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      {canManage && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
              Edit
            </Button>
            {user.status === "active" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDisable(user.id)}
              >
                Disable
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
